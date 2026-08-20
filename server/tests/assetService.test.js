const AssetService = require('../services/assetService');
const SupabaseAssetRepository = require('../repositories/supabaseAssetRepository');
const SupabaseStorageRepository = require('../repositories/supabaseStorageRepository');
const { ValidationError, ForbiddenError, StorageError } = require('../errors/AppErrors');

describe('AssetService', () => {
  let assetService;
  let assetRepo;
  let storageRepo;

  beforeEach(() => {
    assetRepo = new SupabaseAssetRepository();
    storageRepo = new SupabaseStorageRepository();
    assetService = new AssetService(assetRepo, storageRepo, 'project-assets');
  });

  test('uploadAsset() successfully validates, uploads, and activates asset', async () => {
    // PNG file header magic bytes: 89 50 4E 47
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 100, 0, 0, 0, 50, 8, 6, 0, 0, 0, 87, 106, 216, 245]);

    const result = await assetService.uploadAsset({
      fileBuffer: validPngBuffer,
      originalFilename: 'image.png',
      mimeType: 'image/png',
      ownerId: '33333333-3333-3333-3333-333333333333',
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe('active');
    expect(result.mimeType).toBe('image/png');
    expect(result.url).toBeDefined();
  });

  test('uploadAsset() throws ValidationError for file extension mismatch or signature spoofing', async () => {
    const fakePngBuffer = Buffer.from('this is text content not png magic bytes');

    await expect(
      assetService.uploadAsset({
        fileBuffer: fakePngBuffer,
        originalFilename: 'fake.png',
        mimeType: 'image/png',
      })
    ).rejects.toThrow(ValidationError);
  });

  test('uploadAsset() compensates DB record if storage upload fails', async () => {
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 10, 74, 70, 73, 70, 0, 1]);

    // Mock storageRepo.upload to throw StorageError
    jest.spyOn(storageRepo, 'upload').mockRejectedValueOnce(new StorageError('Mock storage crash'));
    const deleteSpy = jest.spyOn(assetRepo, 'hardDeleteAsset');

    await expect(
      assetService.uploadAsset({
        fileBuffer: validJpgBuffer,
        originalFilename: 'test.jpg',
        mimeType: 'image/jpeg',
      })
    ).rejects.toThrow(StorageError);

    expect(deleteSpy).toHaveBeenCalled();
  });

  test('deleteAsset() throws ForbiddenError if non-owner attempts deletion', async () => {
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 10, 74, 70, 73, 70, 0, 1]);
    const ownerId = '44444444-4444-4444-4444-444444444444';
    const strangerUser = { id: '99999999-9999-9999-9999-999999999999', role: 'student' };

    const asset = await assetService.uploadAsset({
      fileBuffer: validJpgBuffer,
      originalFilename: 'photo.jpg',
      mimeType: 'image/jpeg',
      ownerId,
    });

    await expect(
      assetService.deleteAsset(asset.id, strangerUser)
    ).rejects.toThrow(ForbiddenError);
  });

  test('generateUploadUrl() creates pre-signed upload URL', async () => {
    const result = await assetService.generateUploadUrl({
      originalFilename: 'document.pdf',
      mimeType: 'application/pdf',
      ownerId: '55555555-5555-5555-5555-555555555555',
    });

    expect(result.assetId).toBeDefined();
    expect(result.uploadUrl).toBeDefined();
    expect(result.expiresInSeconds).toBe(900);
  });
});
