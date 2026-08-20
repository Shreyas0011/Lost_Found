const AssetService = require('../services/assetService');
const { ValidationError } = require('../errors/AppErrors');

class AssetController {
  constructor(assetService = new AssetService()) {
    this.assetService = assetService;
  }

  /**
   * POST /api/assets - Server-managed file upload
   */
  uploadAsset = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file provided in request. Field name must be "file".');
      }

      const ownerId = req.user ? (req.user.id || req.user.userId) : (req.student ? req.student.id : (req.admin ? req.admin.id : null));
      const { entityType, entityId } = req.body || {};

      const asset = await this.assetService.uploadAsset({
        fileBuffer: req.file.buffer,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerId,
        entityType,
        entityId,
      });

      return res.status(201).json({
        success: true,
        message: 'Asset uploaded successfully.',
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/assets/upload-url - Pre-signed upload URL generation
   */
  generateUploadUrl = async (req, res, next) => {
    try {
      const ownerId = req.user ? (req.user.id || req.user.userId) : (req.student ? req.student.id : (req.admin ? req.admin.id : null));
      const { originalFilename, mimeType, entityType, entityId } = req.body;

      const result = await this.assetService.generateUploadUrl({
        originalFilename,
        mimeType,
        ownerId,
        entityType,
        entityId,
      });

      return res.status(200).json({
        success: true,
        message: 'Upload URL generated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/assets/:id/complete - Finalize direct upload
   */
  completeDirectUpload = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userContext = req.user || req.student || req.admin;

      const asset = await this.assetService.completeDirectUpload(id, userContext);

      return res.status(200).json({
        success: true,
        message: 'Asset upload finalized successfully.',
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/assets/:id - Get asset metadata & access URLs
   */
  getAssetById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userContext = req.user || req.student || req.admin;

      const asset = await this.assetService.getAssetById(id, userContext);

      return res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/assets - List assets with pagination & filters
   */
  listAssets = async (req, res, next) => {
    try {
      const { page, limit, status, mimeType, ownerId } = req.query;
      const userContext = req.user || req.student || req.admin;

      const filterOptions = {
        status,
        mimeType,
        ownerId,
      };

      const paginationOptions = {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      };

      const result = await this.assetService.listAssets(filterOptions, paginationOptions, userContext);

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/assets/:id - Delete asset
   */
  deleteAsset = async (req, res, next) => {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';
      const userContext = req.user || req.student || req.admin;

      const result = await this.assetService.deleteAsset(id, userContext, hardDelete);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = AssetController;
