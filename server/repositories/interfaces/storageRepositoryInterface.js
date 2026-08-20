/**
 * Storage Repository Interface Contract
 * Abstract class defining the required operations for Blob/Object Storage.
 */
class StorageRepositoryInterface {
  async upload(bucket, objectKey, buffer, options = {}) {
    throw new Error('Method upload() must be implemented');
  }

  async delete(bucket, objectKey) {
    throw new Error('Method delete() must be implemented');
  }

  async exists(bucket, objectKey) {
    throw new Error('Method exists() must be implemented');
  }

  async createSignedUrl(bucket, objectKey, expiresInSeconds = 3600) {
    throw new Error('Method createSignedUrl() must be implemented');
  }

  getPublicUrl(bucket, objectKey) {
    throw new Error('Method getPublicUrl() must be implemented');
  }

  async move(bucket, fromObjectKey, toObjectKey) {
    throw new Error('Method move() must be implemented');
  }
}

module.exports = StorageRepositoryInterface;
