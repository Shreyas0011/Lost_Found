/**
 * Asset Repository Interface Contract
 * Abstract class defining the required database CRUD operations for Assets.
 */
class AssetRepositoryInterface {
  async createAsset(assetData) {
    throw new Error('Method createAsset() must be implemented');
  }

  async getAssetById(id) {
    throw new Error('Method getAssetById() must be implemented');
  }

  async getAssetsByOwner(ownerId, options = {}) {
    throw new Error('Method getAssetsByOwner() must be implemented');
  }

  async getAssetsByEntity(entityType, entityId, options = {}) {
    throw new Error('Method getAssetsByEntity() must be implemented');
  }

  async updateAsset(id, updateData) {
    throw new Error('Method updateAsset() must be implemented');
  }

  async softDeleteAsset(id) {
    throw new Error('Method softDeleteAsset() must be implemented');
  }

  async hardDeleteAsset(id) {
    throw new Error('Method hardDeleteAsset() must be implemented');
  }

  async existsByObjectKey(objectKey) {
    throw new Error('Method existsByObjectKey() must be implemented');
  }
}

module.exports = AssetRepositoryInterface;
