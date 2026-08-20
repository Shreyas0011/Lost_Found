const crypto = require('crypto');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { DatabaseError, NotFoundError } = require('../errors/AppErrors');

class SupabaseClaimRepository {
  constructor(client = supabaseAdmin) {
    this.client = client;
    this.table = 'ownership_requests';
    this.inMemoryDb = new Map();
  }

  _mapClaim(record) {
    if (!record) return null;
    return {
      id: record.id,
      _id: record.id,
      item_id: record.item_id && typeof record.item_id === 'object' ? record.item_id : (record.items ? {
        id: record.items.id,
        _id: record.items.id,
        category: record.items.category,
        brand: record.items.brand || '',
        color: record.items.color || '',
        location_found: record.items.location_found,
        date_found: record.items.date_found,
        image_url: record.items.image_url,
        status: record.items.status,
        description: record.items.description,
        serial_number: record.items.serial_number,
        uid: record.items.uid,
      } : record.item_id),
      student_id: record.student_id && typeof record.student_id === 'object' ? record.student_id : (record.students ? {
        id: record.students.id,
        _id: record.students.id,
        name: record.students.name,
        registration_number: record.students.registration_number,
        email: record.students.email,
        class: record.students.class,
        section: record.students.section,
      } : record.student_id),
      message: record.message,
      status: record.status || 'PENDING',
      in_person_request: {
        preferred_date: record.in_person_preferred_date || null,
        preferred_time: record.in_person_preferred_time || '',
        note: record.in_person_note || '',
        status: record.in_person_status || 'NONE',
      },
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async createClaim(claimData) {
    const id = claimData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      item_id: typeof claimData.item_id === 'object' ? claimData.item_id.id : claimData.item_id,
      student_id: typeof claimData.student_id === 'object' ? claimData.student_id.id : claimData.student_id,
      message: claimData.message,
      status: claimData.status || 'PENDING',
      in_person_preferred_date: claimData.in_person_request?.preferred_date ? new Date(claimData.in_person_request.preferred_date).toISOString() : null,
      in_person_preferred_time: claimData.in_person_request?.preferred_time || '',
      in_person_note: claimData.in_person_request?.note || '',
      in_person_status: claimData.in_person_request?.status || 'NONE',
      created_at: claimData.createdAt || now,
      updated_at: claimData.updatedAt || now,
    };

    if (useMockClient) {
      this.inMemoryDb.set(id, record);
      return this._mapClaim(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert([record])
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to insert claim: ${error.message}`, error);
      return this._mapClaim(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Claim creation error: ${err.message}`, err);
    }
  }

  async getClaimById(id, populate = true) {
    if (!id) return null;

    if (useMockClient) {
      const record = this.inMemoryDb.get(id);
      return this._mapClaim(record);
    }

    try {
      const query = populate
        ? this.client.from(this.table).select('*, items(*), students(*)')
        : this.client.from(this.table).select('*');

      const { data, error } = await query.eq('id', id).maybeSingle();
      if (error) throw new DatabaseError(`Failed to fetch claim: ${error.message}`, error);
      return this._mapClaim(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Claim fetch error: ${err.message}`, err);
    }
  }

  async getClaimsByStudent(studentId) {
    if (useMockClient) {
      const all = Array.from(this.inMemoryDb.values()).filter((c) => c.student_id === studentId);
      return all.map((r) => this._mapClaim(r));
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*, items(*), students(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw new DatabaseError(`Failed to fetch student claims: ${error.message}`, error);
      return (data || []).map((r) => this._mapClaim(r));
    } catch (err) {
      return [];
    }
  }

  async findClaimByItemAndStudent(itemId, studentId) {
    if (useMockClient) {
      const found = Array.from(this.inMemoryDb.values()).find(
        (c) => c.item_id === itemId && c.student_id === studentId
      );
      return this._mapClaim(found);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('item_id', itemId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw new DatabaseError(`Failed to find claim: ${error.message}`, error);
      return this._mapClaim(data);
    } catch (err) {
      return null;
    }
  }

  async getAllClaims(filter = {}) {
    if (useMockClient) {
      let all = Array.from(this.inMemoryDb.values());
      if (filter.status) all = all.filter((c) => c.status === filter.status);
      return all.map((r) => this._mapClaim(r));
    }

    try {
      let query = this.client.from(this.table).select('*, items(*), students(*)');
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.item_id) query = query.eq('item_id', filter.item_id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new DatabaseError(`Failed to fetch all claims: ${error.message}`, error);
      return (data || []).map((r) => this._mapClaim(r));
    } catch (err) {
      return [];
    }
  }

  async updateClaim(id, updateData) {
    const now = new Date().toISOString();
    const record = { updated_at: now };

    if (updateData.status) record.status = updateData.status;

    if (updateData.in_person_request) {
      const ip = updateData.in_person_request;
      if (ip.preferred_date !== undefined) record.in_person_preferred_date = ip.preferred_date ? new Date(ip.preferred_date).toISOString() : null;
      if (ip.preferred_time !== undefined) record.in_person_preferred_time = ip.preferred_time;
      if (ip.note !== undefined) record.in_person_note = ip.note;
      if (ip.status !== undefined) record.in_person_status = ip.status;
    }

    if (useMockClient) {
      const existing = this.inMemoryDb.get(id);
      if (!existing) throw new NotFoundError(`Claim ${id} not found`);
      const updated = { ...existing, ...record };
      this.inMemoryDb.set(id, updated);
      return this._mapClaim(updated);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(record)
        .eq('id', id)
        .select('*, items(*), students(*)')
        .single();

      if (error) throw new DatabaseError(`Failed to update claim: ${error.message}`, error);
      return this._mapClaim(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Claim update error: ${err.message}`, err);
    }
  }

  async deleteClaimsByItem(itemId) {
    if (useMockClient) {
      const toDelete = Array.from(this.inMemoryDb.values()).filter((c) => c.item_id === itemId);
      toDelete.forEach((c) => this.inMemoryDb.delete(c.id));
      return { success: true };
    }

    try {
      const { error } = await this.client.from(this.table).delete().eq('item_id', itemId);
      if (error) throw new DatabaseError(`Failed to delete claims by item: ${error.message}`, error);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }

  async countClaims(filter = {}) {
    if (useMockClient) {
      let all = Array.from(this.inMemoryDb.values());
      if (filter.status) all = all.filter((c) => c.status === filter.status);
      return all.length;
    }

    try {
      let query = this.client.from(this.table).select('id', { count: 'exact', head: true });
      if (filter.status) query = query.eq('status', filter.status);

      const { count, error } = await query;
      if (error) throw new DatabaseError(`Failed to count claims: ${error.message}`, error);
      return count || 0;
    } catch (err) {
      return 0;
    }
  }
}

module.exports = SupabaseClaimRepository;
