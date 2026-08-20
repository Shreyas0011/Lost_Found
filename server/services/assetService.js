const crypto = require('crypto');
const config = require('../config/supabase');
const fileValidationService = require('./fileValidationService');
const imageProcessingService = require('./imageProcessingService');
const SupabaseAssetRepository = require('../repositories/supabaseAssetRepository');
const SupabaseStorageRepository = require('../repositories/supabaseStorageRepository');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  StorageError,
  DatabaseError,
} = require('../errors/AppErrors');

class AssetService {
  constructor(
    assetRepository = new SupabaseAssetRepository(),
    storageRepository = new SupabaseStorageRepository(),
    bucketName = config.bucket
  ) {
    this.assetRepo = assetRepository;
    this.storageRepo = storageRepository;
    this.bucket = bucketName;
  }

  /**
   * Helper: Builds object key path using UUID
   */
  _generateObjectKey(ownerId, entityType, entityId, extension) {
    const randomUuid = crypto.randomUUID();
    const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;

    if (entityType && entityId) {
      return `entities/${entityType}/${entityId}/${randomUuid}${cleanExt}`;
    }
    if (ownerId) {
      return `users/${ownerId}/${randomUuid}${cleanExt}`;
    }
    return `temporary/${randomUuid}${cleanExt}`;
  }

  /**
   * Helper: Check authorization boundaries
   */
  _checkAssetAccess(asset, userContext, action = 'read') {
    if (!userContext) return; // Unauthenticated / internal call
    const role = userContext.role || 'student';
    const userId = userContext.id || userContext.userId;

    if (role === 'admin' || role === 'superadmin') {
      return; // Admins have full access
    }

    if (asset.ownerId && asset.ownerId !== userId) {
      throw new ForbiddenError(`You do not have permission to ${action} this asset.`);
    }
  }

  /**
   * Server-managed upload flow with compensation logic
   */
  async uploadAsset({ fileBuffer, originalFilename, mimeType, ownerId, entityType, entityId }) {
    // 1. Validation
    const validation = fileValidationService.validateFile(fileBuffer, originalFilename, mimeType);

    // 2. Generate object key
    const objectKey = this._generateObjectKey(ownerId, entityType, entityId, validation.extension);

    // 3. Create initial asset record in DB (status: uploading)
    let assetRecord = null;
    try {
      assetRecord = await this.assetRepo.createAsset({
        ownerId: ownerId || null,
        bucket: this.bucket,
        objectKey,
        originalFilename,
        mimeType: validation.mimeType,
        extension: validation.extension,
        sizeBytes: validation.sizeBytes,
        status: 'uploading',
      });
    } catch (dbErr) {
      throw new DatabaseError(`Failed to initialize asset record: ${dbErr.message}`, dbErr);
    }

    // 4. Image processing / metadata extraction
    let width = null;
    let height = null;
    let uploadBuffer = fileBuffer;
    let finalContentType = validation.mimeType;

    try {
      const processed = await imageProcessingService.processImage(fileBuffer, validation.mimeType);
      uploadBuffer = processed.processedBuffer;
      finalContentType = processed.contentType;
      width = processed.width;
      height = processed.height;
    } catch (imgErr) {
      // Non-fatal metadata extraction fallback
    }

    // 5. Upload blob to Storage Repository
    let storageResult = null;
    try {
      storageResult = await this.storageRepo.upload(this.bucket, objectKey, uploadBuffer, {
        contentType: finalContentType,
      });
    } catch (storageErr) {
      // Compensation: Clean up initial database record if storage upload failed
      try {
        await this.assetRepo.hardDeleteAsset(assetRecord.id);
      } catch (cleanErr) {
        console.error('Failed to clean up DB record after storage upload failure:', cleanErr);
      }
      throw new StorageError(`Upload to storage failed: ${storageErr.message}`, storageErr);
    }

    // 6. Update DB record to active status with metadata
    let activeAsset = null;
    try {
      activeAsset = await this.assetRepo.updateAsset(assetRecord.id, {
        status: 'active',
        width,
        height,
        objectKey,
      });
    } catch (updateErr) {
      // Compensation: Delete uploaded Storage object if DB update fails to prevent orphaned blobs
      try {
        await this.storageRepo.delete(this.bucket, objectKey);
      } catch (storageCleanErr) {
        console.error('Failed to compensate storage object after DB update failure:', storageCleanErr);
      }
      throw new DatabaseError(`Failed to activate asset record: ${updateErr.message}`, updateErr);
    }

    // 7. Attach public / signed access URL
    const accessUrl = this.storageRepo.getPublicUrl(this.bucket, activeAsset.objectKey);
    return {
      ...activeAsset,
      url: accessUrl,
    };
  }

  /**
   * Pre-signed Upload URL generation for direct client uploads
   */
  async generateUploadUrl({ originalFilename, mimeType, ownerId, entityType, entityId }) {
    const ext = originalFilename ? require('path').extname(originalFilename).toLowerCase() : '';
    if (!ext) {
      throw new ValidationError('Original filename with extension is required.');
    }

    const objectKey = this._generateObjectKey(ownerId, entityType, entityId, ext);

    // Create DB record with status uploading
    const assetRecord = await this.assetRepo.createAsset({
      ownerId: ownerId || null,
      bucket: this.bucket,
      objectKey,
      originalFilename,
      mimeType,
      extension: ext,
      sizeBytes: 0,
      status: 'uploading',
    });

    // Generate signed upload URL (valid for 15 minutes)
    const signedUrl = await this.storageRepo.createSignedUrl(this.bucket, objectKey, 900);

    return {
      assetId: assetRecord.id,
      objectKey,
      uploadUrl: signedUrl,
      expiresInSeconds: 900,
    };
  }

  /**
   * Finalize pre-signed upload
   */
  async completeDirectUpload(assetId, userContext) {
    const asset = await this.assetRepo.getAssetById(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${assetId} not found.`);
    }

    this._checkAssetAccess(asset, userContext, 'update');

    // Check if file exists in storage
    const exists = await this.storageRepo.exists(this.bucket, asset.objectKey);
    if (!exists) {
      await this.assetRepo.updateAsset(assetId, { status: 'failed' });
      throw new ValidationError('File object was not found in storage. Direct upload incomplete or failed.');
    }

    const updated = await this.assetRepo.updateAsset(assetId, { status: 'active' });
    const accessUrl = this.storageRepo.getPublicUrl(this.bucket, updated.objectKey);

    return {
      ...updated,
      url: accessUrl,
    };
  }

  /**
   * Get asset metadata by ID with access URL
   */
  async getAssetById(id, userContext) {
    const asset = await this.assetRepo.getAssetById(id);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${id} not found.`);
    }

    this._checkAssetAccess(asset, userContext, 'read');

    const signedUrl = await this.storageRepo.createSignedUrl(this.bucket, asset.objectKey, 3600);
    const publicUrl = this.storageRepo.getPublicUrl(this.bucket, asset.objectKey);

    return {
      ...asset,
      url: publicUrl,
      signedUrl,
    };
  }

  /**
   * List assets with pagination and filters
   */
  async listAssets(filterOptions = {}, paginationOptions = {}, userContext = null) {
    // If not admin, restrict owner filter to current user
    if (userContext && userContext.role !== 'admin' && userContext.role !== 'superadmin') {
      filterOptions.ownerId = userContext.id || userContext.userId;
    }

    const result = await this.assetRepo.listAssets(filterOptions, paginationOptions);

    // Attach access URLs
    const dataWithUrls = result.data.map((item) => ({
      ...item,
      url: this.storageRepo.getPublicUrl(this.bucket, item.objectKey),
    }));

    return {
      data: dataWithUrls,
      pagination: result.pagination,
    };
  }

  /**
   * Delete asset with storage compensation
   */
  async deleteAsset(id, userContext, hardDelete = false) {
    const asset = await this.assetRepo.getAssetById(id);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${id} not found.`);
    }

    this._checkAssetAccess(asset, userContext, 'delete');

    if (hardDelete) {
      // 1. Delete from Storage
      await this.storageRepo.delete(this.bucket, asset.objectKey);
      // 2. Delete from DB
      await this.assetRepo.hardDeleteAsset(id);
    } else {
      // Soft delete DB record
      await this.assetRepo.softDeleteAsset(id);
      // Clean storage object
      try {
        await this.storageRepo.delete(this.bucket, asset.objectKey);
      } catch (err) {
        console.error('Storage deletion warning during soft delete:', err);
      }
    }

    return { success: true, message: `Asset ${id} deleted successfully.` };
  }
}

module.exports = AssetService;
