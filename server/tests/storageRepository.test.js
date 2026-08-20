const SupabaseStorageRepository = require('../repositories/supabaseStorageRepository');

describe('SupabaseStorageRepository', () => {
  let storageRepo;

  beforeEach(() => {
    storageRepo = new SupabaseStorageRepository();
  });

  test('upload() stores file in storage', async () => {
    const buffer = Buffer.from('test file content');
    const result = await storageRepo.upload('project-assets', 'test/item.txt', buffer, {
      contentType: 'text/plain',
    });

    expect(result).toBeDefined();
    expect(result.path).toBe('test/item.txt');
  });

  test('exists() returns true for uploaded object', async () => {
    const buffer = Buffer.from('hello world');
    await storageRepo.upload('project-assets', 'check/file.txt', buffer);

    const exists = await storageRepo.exists('project-assets', 'check/file.txt');
    expect(exists).toBe(true);
  });

  test('getPublicUrl() returns formatted URL string', () => {
    const url = storageRepo.getPublicUrl('project-assets', 'public/logo.png');
    expect(url).toContain('project-assets/public/logo.png');
  });

  test('createSignedUrl() returns signed URL', async () => {
    const signedUrl = await storageRepo.createSignedUrl('project-assets', 'private/doc.pdf', 3600);
    expect(signedUrl).toContain('doc.pdf');
  });

  test('delete() removes object from storage', async () => {
    const buffer = Buffer.from('to delete');
    await storageRepo.upload('project-assets', 'del/file.txt', buffer);

    const deleteRes = await storageRepo.delete('project-assets', 'del/file.txt');
    expect(deleteRes.success).toBe(true);

    const existsAfter = await storageRepo.exists('project-assets', 'del/file.txt');
    expect(existsAfter).toBe(false);
  });
});
