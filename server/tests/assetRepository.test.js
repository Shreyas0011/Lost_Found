const SupabaseAssetRepository = require('../repositories/supabaseAssetRepository');

describe('SupabaseAssetRepository', () => {
  let assetRepo;

  beforeEach(() => {
    assetRepo = new SupabaseAssetRepository();
  });

  test('createAsset() creates and returns mapped asset', async () => {
    const assetData = {
      ownerId: '11111111-1111-1111-1111-111111111111',
      bucket: 'project-assets',
      objectKey: 'users/11111111-1111-1111-1111-111111111111/test.jpg',
      originalFilename: 'test.jpg',
      mimeType: 'image/jpeg',
      extension: '.jpg',
      sizeBytes: 1024,
      status: 'uploading',
    };

    const created = await assetRepo.createAsset(assetData);

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.ownerId).toBe(assetData.ownerId);
    expect(created.bucket).toBe('project-assets');
    expect(created.objectKey).toBe(assetData.objectKey);
    expect(created.status).toBe('uploading');
  });

  test('getAssetById() retrieves active asset', async () => {
    const created = await assetRepo.createAsset({
      ownerId: '11111111-1111-1111-1111-111111111111',
      bucket: 'project-assets',
      objectKey: 'users/111/doc.pdf',
      originalFilename: 'doc.pdf',
      mimeType: 'application/pdf',
      extension: '.pdf',
      sizeBytes: 2048,
    });

    const fetched = await assetRepo.getAssetById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(created.id);
    expect(fetched.originalFilename).toBe('doc.pdf');
  });

  test('updateAsset() modifies status and metadata', async () => {
    const created = await assetRepo.createAsset({
      bucket: 'project-assets',
      objectKey: 'temp/img.png',
      originalFilename: 'img.png',
      mimeType: 'image/png',
      extension: '.png',
      sizeBytes: 500,
    });

    const updated = await assetRepo.updateAsset(created.id, {
      status: 'active',
      width: 800,
      height: 600,
    });

    expect(updated.status).toBe('active');
    expect(updated.width).toBe(800);
    expect(updated.height).toBe(600);
  });

  test('getAssetsByOwner() returns paginated list', async () => {
    const ownerId = '22222222-2222-2222-2222-222222222222';
    await assetRepo.createAsset({ ownerId, bucket: 'project-assets', objectKey: 'key1.jpg', originalFilename: 'f1.jpg', mimeType: 'image/jpeg', extension: '.jpg', sizeBytes: 100 });
    await assetRepo.createAsset({ ownerId, bucket: 'project-assets', objectKey: 'key2.jpg', originalFilename: 'f2.jpg', mimeType: 'image/jpeg', extension: '.jpg', sizeBytes: 200 });

    const result = await assetRepo.getAssetsByOwner(ownerId, { page: 1, limit: 10 });
    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
  });

  test('softDeleteAsset() marks status as deleted', async () => {
    const created = await assetRepo.createAsset({
      bucket: 'project-assets',
      objectKey: 'temp/del.png',
      originalFilename: 'del.png',
      mimeType: 'image/png',
      extension: '.png',
      sizeBytes: 500,
    });

    const deleted = await assetRepo.softDeleteAsset(created.id);
    expect(deleted.status).toBe('deleted');
    expect(deleted.deletedAt).toBeDefined();

    const fetchAttempt = await assetRepo.getAssetById(created.id);
    expect(fetchAttempt).toBeNull();
  });
});
