const crypto = require('crypto');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { DatabaseError, NotFoundError } = require('../errors/AppErrors');

class SupabaseItemRepository {
  constructor(client = supabaseAdmin) {
    this.client = client;
    this.table = 'items';
    this.inMemoryDb = new Map();
  }

  _mapItem(record) {
    if (!record) return null;
    return {
      id: record.id,
      _id: record.id, // For backward compatibility with existing views expecting _id
      serial_number: record.serial_number,
      uid: record.uid,
      category: record.category,
      who_found: record.who_found || '',
      location_found: record.location_found,
      date_found: record.date_found,
      time_found: record.time_found || '',
      description: record.description || '',
      image_url: record.image_url || '',
      image_filename: record.image_filename || '',
      asset_id: record.asset_id || '',
      submitted_by: record.submitted_by,
      registration_number: record.registration_number,
      student_name: record.student_name,
      status: record.status || 'PUBLISHED',
      uploaded_at: record.uploaded_at,
      handover_form_url: record.handover_form_url || '',
      handover_form_filename: record.handover_form_filename || '',
      handover_asset_id: record.handover_asset_id || '',
      handover_date: record.handover_date || null,
      handover_notes: record.handover_notes || '',
      handover_student_name: record.handover_student_name || '',
      handover_reg_number: record.handover_reg_number || '',
      handover_phone: record.handover_phone || '',
      handover_department: record.handover_department || '',
      claimed_by_admin: record.claimed_by_admin || '',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async createItem(itemData) {
    const id = itemData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      serial_number: itemData.serial_number,
      uid: itemData.uid,
      category: itemData.category,
      who_found: itemData.who_found || '',
      location_found: itemData.location_found,
      date_found: new Date(itemData.date_found).toISOString(),
      time_found: itemData.time_found || '',
      description: itemData.description || '',
      image_url: itemData.image_url || '',
      image_filename: itemData.image_filename || '',
      asset_id: itemData.asset_id || null,
      submitted_by: itemData.submitted_by,
      registration_number: itemData.registration_number,
      student_name: itemData.student_name,
      status: itemData.status || 'PUBLISHED',
      uploaded_at: itemData.uploaded_at || now,
      handover_form_url: itemData.handover_form_url || '',
      handover_form_filename: itemData.handover_form_filename || '',
      handover_asset_id: itemData.handover_asset_id || null,
      handover_date: itemData.handover_date ? new Date(itemData.handover_date).toISOString() : null,
      handover_notes: itemData.handover_notes || '',
      handover_student_name: itemData.handover_student_name || '',
      handover_reg_number: itemData.handover_reg_number || '',
      handover_phone: itemData.handover_phone || '',
      handover_department: itemData.handover_department || '',
      claimed_by_admin: itemData.claimed_by_admin || '',
      created_at: itemData.createdAt || now,
      updated_at: itemData.updatedAt || now,
    };

    if (useMockClient) {
      this.inMemoryDb.set(id, record);
      return this._mapItem(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert([record])
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to insert item: ${error.message}`, error);
      }

      return this._mapItem(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Item creation error: ${err.message}`, err);
    }
  }

  async getItemById(id) {
    if (!id) return null;

    if (useMockClient) {
      const record = this.inMemoryDb.get(id);
      return this._mapItem(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch item: ${error.message}`, error);
      }

      return this._mapItem(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Item fetch error: ${err.message}`, err);
    }
  }

  async findItems(filter = {}) {
    if (useMockClient) {
      let all = Array.from(this.inMemoryDb.values());
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          all = all.filter((i) => filter.status.includes(i.status));
        } else {
          all = all.filter((i) => i.status === filter.status);
        }
      }
      all.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      return all.map((r) => this._mapItem(r));
    }

    try {
      let query = this.client.from(this.table).select('*');

      if (filter.status) {
        if (Array.isArray(filter.status)) {
          query = query.in('status', filter.status);
        } else if (typeof filter.status === 'object' && filter.status.$in) {
          query = query.in('status', filter.status.$in);
        } else {
          query = query.eq('status', filter.status);
        }
      }

      if (filter.category) {
        if (Array.isArray(filter.category)) {
          query = query.in('category', filter.category);
        } else if (typeof filter.category === 'object' && filter.category.$in) {
          query = query.in('category', filter.category.$in);
        } else {
          query = query.eq('category', filter.category);
        }
      }

      if (filter.location_found) {
        if (Array.isArray(filter.location_found)) {
          query = query.in('location_found', filter.location_found);
        } else if (typeof filter.location_found === 'object' && filter.location_found.$in) {
          query = query.in('location_found', filter.location_found.$in);
        } else {
          query = query.eq('location_found', filter.location_found);
        }
      }

      if (filter.student_name) {
        if (Array.isArray(filter.student_name)) {
          query = query.in('student_name', filter.student_name);
        } else if (typeof filter.student_name === 'object' && filter.student_name.$in) {
          query = query.in('student_name', filter.student_name.$in);
        } else {
          query = query.eq('student_name', filter.student_name);
        }
      }

      if (filter.q) {
        query = query.or(`serial_number.ilike.%${filter.q}%,uid.ilike.%${filter.q}%,description.ilike.%${filter.q}%,who_found.ilike.%${filter.q}%`);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Failed to find items: ${error.message}`, error);
      }

      return (data || []).map((r) => this._mapItem(r));
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Item listing error: ${err.message}`, err);
    }
  }

  async updateItem(id, updateData) {
    const now = new Date().toISOString();
    const record = { updated_at: now };

    const fields = [
      'serial_number', 'uid', 'category', 'who_found', 'location_found',
      'date_found', 'time_found', 'description', 'image_url', 'image_filename',
      'asset_id', 'status', 'handover_form_url', 'handover_form_filename',
      'handover_asset_id', 'handover_date', 'handover_notes', 'handover_student_name',
      'handover_reg_number', 'handover_phone', 'handover_department', 'claimed_by_admin',
      'student_name', 'registration_number'
    ];

    fields.forEach((f) => {
      if (updateData[f] !== undefined) {
        if ((f === 'date_found' || f === 'handover_date') && updateData[f]) {
          record[f] = new Date(updateData[f]).toISOString();
        } else {
          record[f] = updateData[f];
        }
      }
    });

    if (useMockClient) {
      const existing = this.inMemoryDb.get(id);
      if (!existing) throw new NotFoundError(`Item ${id} not found`);
      const updated = { ...existing, ...record };
      this.inMemoryDb.set(id, updated);
      return this._mapItem(updated);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(record)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update item: ${error.message}`, error);
      }

      return this._mapItem(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Item update error: ${err.message}`, err);
    }
  }

  async deleteItem(id) {
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
        throw new DatabaseError(`Failed to delete item: ${error.message}`, error);
      }

      return { success: true };
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Item delete error: ${err.message}`, err);
    }
  }

  async countItems(filter = {}) {
    if (useMockClient) {
      let all = Array.from(this.inMemoryDb.values());
      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$nin) {
          all = all.filter((i) => !filter.status.$nin.includes(i.status));
        } else {
          all = all.filter((i) => i.status === filter.status);
        }
      }
      return all.length;
    }

    try {
      let query = this.client.from(this.table).select('id', { count: 'exact', head: true });

      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$nin) {
          query = query.not('status', 'in', `(${filter.status.$nin.join(',')})`);
        } else {
          query = query.eq('status', filter.status);
        }
      }

      if (filter.uploaded_at && filter.uploaded_at.$lte) {
        query = query.lte('uploaded_at', new Date(filter.uploaded_at.$lte).toISOString());
      }

      const { count, error } = await query;
      if (error) throw new DatabaseError(`Failed to count items: ${error.message}`, error);
      return count || 0;
    } catch (err) {
      return 0;
    }
  }

  async getExpiringItems(cutoffDate) {
    const isoCutoff = new Date(cutoffDate).toISOString();

    if (useMockClient) {
      return Array.from(this.inMemoryDb.values())
        .filter((i) => new Date(i.uploaded_at) < new Date(isoCutoff) && !['CLAIMED', 'RETURNED', 'EXPIRED'].includes(i.status))
        .map((r) => this._mapItem(r));
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .lt('uploaded_at', isoCutoff)
        .not('status', 'in', '("CLAIMED","RETURNED","EXPIRED")');

      if (error) throw new DatabaseError(`Failed to fetch expiring items: ${error.message}`, error);
      return (data || []).map((r) => this._mapItem(r));
    } catch (err) {
      return [];
    }
  }
}

module.exports = SupabaseItemRepository;
