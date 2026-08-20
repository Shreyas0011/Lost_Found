const crypto = require('crypto');
const AssetRepositoryInterface = require('./interfaces/assetRepositoryInterface');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { DatabaseError, NotFoundError } = require('../errors/AppErrors');

class SupabaseAssetRepository extends AssetRepositoryInterface {
  constructor(client = supabaseAdmin) {
    super();
    this.client = client;
    this.table = 'assets';
    this.inMemoryDb = new Map(); // Fallback in-memory DB for testing / offline mode
  }

  // Maps database record into application-level object
  _mapAsset(record) {
    if (!record) return null;
    return {
      id: record.id,
      ownerId: record.owner_id,
      bucket: record.bucket,
      objectKey: record.object_key,
      originalFilename: record.original_filename,
      mimeType: record.mime_type,
      extension: record.extension,
      sizeBytes: record.size_bytes ? parseInt(record.size_bytes, 10) : 0,
      width: record.width || null,
      height: record.height || null,
      status: record.status || 'active',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at || null,
    };
  }

  async createAsset(assetData) {
    const now = new Date().toISOString();
    const id = assetData.id || crypto.randomUUID();

    const record = {
      id,
      owner_id: assetData.ownerId || assetData.owner_id || null,
      bucket: assetData.bucket,
      object_key: assetData.objectKey || assetData.object_key,
      original_filename: assetData.originalFilename || assetData.original_filename,
      mime_type: assetData.mimeType || assetData.mime_type,
      extension: assetData.extension,
      size_bytes: assetData.sizeBytes || assetData.size_bytes || 0,
      width: assetData.width || null,
      height: assetData.height || null,
      status: assetData.status || 'uploading',
      created_at: assetData.createdAt || now,
      updated_at: assetData.updatedAt || now,
      deleted_at: null,
    };

    if (useMockClient) {
      this.inMemoryDb.set(id, record);
      return this._mapAsset(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert([record])
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to insert asset: ${error.message}`, error);
      }

      return this._mapAsset(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset creation error: ${err.message}`, err);
    }
  }

  async getAssetById(id) {
    if (useMockClient) {
      const record = this.inMemoryDb.get(id);
      if (!record || record.deleted_at) return null;
      return this._mapAsset(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError(`Failed to fetch asset: ${error.message}`, error);
      }

      return this._mapAsset(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset fetch error: ${err.message}`, err);
    }
  }

  async getAssetsByOwner(ownerId, options = {}) {
    const page = Math.max(1, parseInt(options.page || 1, 10));
    const limit = Math.max(1, parseInt(options.limit || 20, 10));
    const offset = (page - 1) * limit;

    if (useMockClient) {
      const all = Array.from(this.inMemoryDb.values())
        .filter((item) => item.owner_id === ownerId && !item.deleted_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = all.length;
      const data = all.slice(offset, offset + limit).map((r) => this._mapAsset(r));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    }

    try {
      const { data, error, count } = await this.client
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('owner_id', ownerId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to fetch assets by owner: ${error.message}`, error);
      }

      const total = count || 0;
      return {
        data: (data || []).map((r) => this._mapAsset(r)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset query error: ${err.message}`, err);
    }
  }

  async getAssetsByEntity(entityType, entityId, options = {}) {
    const page = Math.max(1, parseInt(options.page || 1, 10));
    const limit = Math.max(1, parseInt(options.limit || 20, 10));
    const offset = (page - 1) * limit;
    const prefix = `entities/${entityType}/${entityId}/`;

    if (useMockClient) {
      const all = Array.from(this.inMemoryDb.values())
        .filter((item) => item.object_key && item.object_key.startsWith(prefix) && !item.deleted_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = all.length;
      const data = all.slice(offset, offset + limit).map((r) => this._mapAsset(r));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    }

    try {
      const { data, error, count } = await this.client
        .from(this.table)
        .select('*', { count: 'exact' })
        .like('object_key', `${prefix}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to fetch assets by entity: ${error.message}`, error);
      }

      const total = count || 0;
      return {
        data: (data || []).map((r) => this._mapAsset(r)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset query error: ${err.message}`, err);
    }
  }

  async listAssets(filter = {}, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const limit = Math.max(1, parseInt(pagination.limit || 20, 10));
    const offset = (page - 1) * limit;

    if (useMockClient) {
      let all = Array.from(this.inMemoryDb.values()).filter((i) => !i.deleted_at);

      if (filter.ownerId) {
        all = all.filter((i) => i.owner_id === filter.ownerId);
      }
      if (filter.status) {
        all = all.filter((i) => i.status === filter.status);
      }
      if (filter.mimeType) {
        all = all.filter((i) => i.mime_type === filter.mimeType);
      }

      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = all.length;
      const data = all.slice(offset, offset + limit).map((r) => this._mapAsset(r));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    }

    try {
      let query = this.client
        .from(this.table)
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (filter.ownerId) query = query.eq('owner_id', filter.ownerId);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.mimeType) query = query.eq('mime_type', filter.mimeType);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to list assets: ${error.message}`, error);
      }

      const total = count || 0;
      return {
        data: (data || []).map((r) => this._mapAsset(r)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset listing error: ${err.message}`, err);
    }
  }

  async updateAsset(id, updateData) {
    const now = new Date().toISOString();
    const updateRecord = {
      updated_at: now,
    };

    if (updateData.status !== undefined) updateRecord.status = updateData.status;
    if (updateData.width !== undefined) updateRecord.width = updateData.width;
    if (updateData.height !== undefined) updateRecord.height = updateData.height;
    if (updateData.objectKey !== undefined) updateRecord.object_key = updateData.objectKey;
    if (updateData.originalFilename !== undefined) updateRecord.original_filename = updateData.originalFilename;

    if (useMockClient) {
      const existing = this.inMemoryDb.get(id);
      if (!existing || existing.deleted_at) throw new NotFoundError(`Asset with ID ${id} not found`);
      const updated = { ...existing, ...updateRecord };
      this.inMemoryDb.set(id, updated);
      return this._mapAsset(updated);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(updateRecord)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update asset: ${error.message}`, error);
      }

      return this._mapAsset(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset update error: ${err.message}`, err);
    }
  }

  async softDeleteAsset(id) {
    const now = new Date().toISOString();

    if (useMockClient) {
      const existing = this.inMemoryDb.get(id);
      if (!existing) throw new NotFoundError(`Asset with ID ${id} not found`);
      existing.status = 'deleted';
      existing.deleted_at = now;
      existing.updated_at = now;
      this.inMemoryDb.set(id, existing);
      return this._mapAsset(existing);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({ status: 'deleted', deleted_at: now, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to soft delete asset: ${error.message}`, error);
      }

      return this._mapAsset(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset delete error: ${err.message}`, err);
    }
  }

  async hardDeleteAsset(id) {
    if (useMockClient) {
      const had = this.inMemoryDb.has(id);
      this.inMemoryDb.delete(id);
      return { success: true, deleted: had };
    }

    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to hard delete asset: ${error.message}`, error);
      }

      return { success: true };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Asset delete error: ${err.message}`, err);
    }
  }

  async existsByObjectKey(objectKey) {
    if (useMockClient) {
      return Array.from(this.inMemoryDb.values()).some((i) => i.object_key === objectKey && !i.deleted_at);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('id')
        .eq('object_key', objectKey)
        .is('deleted_at', null)
        .single();

      if (error && error.code === 'PGRST116') return false;
      return !!data;
    } catch (err) {
      return false;
    }
  }
}

module.exports = SupabaseAssetRepository;
