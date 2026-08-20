const StorageRepositoryInterface = require('./interfaces/storageRepositoryInterface');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { StorageError } = require('../errors/AppErrors');

class SupabaseStorageRepository extends StorageRepositoryInterface {
  constructor(client = supabaseAdmin) {
    super();
    this.client = client;
    this.inMemoryStore = new Map(); // Fallback for tests when Supabase is not configured
  }

  async upload(bucket, objectKey, buffer, options = {}) {
    if (useMockClient) {
      this.inMemoryStore.set(`${bucket}/${objectKey}`, {
        buffer,
        contentType: options.contentType || 'application/octet-stream',
        uploadedAt: new Date(),
      });
      return {
        path: objectKey,
        fullPath: `${bucket}/${objectKey}`,
      };
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(objectKey, buffer, {
          contentType: options.contentType || 'application/octet-stream',
          upsert: options.upsert !== undefined ? options.upsert : true,
        });

      if (error) {
        throw new StorageError(`Failed to upload object to Supabase Storage: ${error.message}`, error);
      }

      return data;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(`Storage upload error: ${err.message}`, err);
    }
  }

  async delete(bucket, objectKey) {
    if (useMockClient) {
      const key = `${bucket}/${objectKey}`;
      const hadKey = this.inMemoryStore.has(key);
      this.inMemoryStore.delete(key);
      return { success: true, deleted: hadKey };
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .remove([objectKey]);

      if (error) {
        throw new StorageError(`Failed to delete object from Supabase Storage: ${error.message}`, error);
      }

      return { success: true, data };
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(`Storage delete error: ${err.message}`, err);
    }
  }

  async exists(bucket, objectKey) {
    if (useMockClient) {
      return this.inMemoryStore.has(`${bucket}/${objectKey}`);
    }

    try {
      const folder = objectKey.includes('/') ? objectKey.substring(0, objectKey.lastIndexOf('/')) : '';
      const filename = objectKey.includes('/') ? objectKey.substring(objectKey.lastIndexOf('/') + 1) : objectKey;

      const { data, error } = await this.client.storage
        .from(bucket)
        .list(folder, { search: filename });

      if (error) {
        return false;
      }

      return Array.isArray(data) && data.some((item) => item.name === filename);
    } catch (err) {
      return false;
    }
  }

  async createSignedUrl(bucket, objectKey, expiresInSeconds = 3600) {
    if (useMockClient) {
      return `https://placeholder-storage.supabase.co/object/sign/${bucket}/${objectKey}?token=mock-signed-token&expires=${expiresInSeconds}`;
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(objectKey, expiresInSeconds);

      if (error) {
        throw new StorageError(`Failed to create signed URL: ${error.message}`, error);
      }

      return data.signedUrl;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(`Signed URL generation error: ${err.message}`, err);
    }
  }

  getPublicUrl(bucket, objectKey) {
    if (useMockClient) {
      return `https://placeholder-storage.supabase.co/object/public/${bucket}/${objectKey}`;
    }

    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(objectKey);

    return data.publicUrl;
  }

  async move(bucket, fromObjectKey, toObjectKey) {
    if (useMockClient) {
      const fromKey = `${bucket}/${fromObjectKey}`;
      const item = this.inMemoryStore.get(fromKey);
      if (item) {
        this.inMemoryStore.delete(fromKey);
        this.inMemoryStore.set(`${bucket}/${toObjectKey}`, item);
      }
      return { success: true };
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .move(fromObjectKey, toObjectKey);

      if (error) {
        throw new StorageError(`Failed to move object in Supabase Storage: ${error.message}`, error);
      }

      return data;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(`Storage move error: ${err.message}`, err);
    }
  }
}

module.exports = SupabaseStorageRepository;
