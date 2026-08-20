const crypto = require('crypto');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { DatabaseError, NotFoundError } = require('../errors/AppErrors');

class SupabaseStudentRepository {
  constructor(client = supabaseAdmin) {
    this.client = client;
    this.table = 'students';
    this.inMemoryDb = new Map();
  }

  _mapStudent(record) {
    if (!record) return null;
    return {
      id: record.id,
      _id: record.id, // For backward compatibility with existing controllers/views expecting _id
      registration_number: record.registration_number,
      name: record.name,
      email: record.email || '',
      class: record.class || '',
      section: record.section || '',
      parent_name: record.parent_name || '',
      parent_email: record.parent_email || '',
      status: record.status || 'active',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async findByRegistrationNumber(regNum) {
    const cleanReg = (regNum || '').trim().toUpperCase();
    if (!cleanReg) return null;

    if (useMockClient) {
      const found = Array.from(this.inMemoryDb.values()).find(
        (s) => s.registration_number === cleanReg && s.status === 'active'
      );
      return this._mapStudent(found);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('registration_number', cleanReg)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch student by registration number: ${error.message}`, error);
      }

      return this._mapStudent(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Student fetch error: ${err.message}`, err);
    }
  }

  async findById(id) {
    if (!id) return null;

    if (useMockClient) {
      const record = this.inMemoryDb.get(id);
      return this._mapStudent(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch student by ID: ${error.message}`, error);
      }

      return this._mapStudent(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Student fetch error: ${err.message}`, err);
    }
  }

  async createStudent(studentData) {
    const id = studentData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      registration_number: (studentData.registration_number || '').trim().toUpperCase(),
      name: (studentData.name || '').trim(),
      email: (studentData.email || '').trim().toLowerCase(),
      class: (studentData.class || '').trim(),
      section: (studentData.section || '').trim(),
      parent_name: (studentData.parent_name || '').trim(),
      parent_email: (studentData.parent_email || '').trim().toLowerCase(),
      status: studentData.status || 'active',
      created_at: studentData.createdAt || now,
      updated_at: studentData.updatedAt || now,
    };

    if (useMockClient) {
      this.inMemoryDb.set(id, record);
      return this._mapStudent(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert([record])
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create student record: ${error.message}`, error);
      }

      return this._mapStudent(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Student creation error: ${err.message}`, err);
    }
  }

  async upsertStudent(studentData) {
    const cleanReg = (studentData.registration_number || '').trim().toUpperCase();
    const existing = await this.findByRegistrationNumber(cleanReg);

    if (existing) {
      // Update
      const record = {
        name: (studentData.name || existing.name).trim(),
        email: (studentData.email || existing.email).trim().toLowerCase(),
        class: (studentData.class || existing.class).trim(),
        section: (studentData.section || existing.section).trim(),
        parent_name: (studentData.parent_name || existing.parent_name).trim(),
        parent_email: (studentData.parent_email || existing.parent_email).trim().toLowerCase(),
        updated_at: new Date().toISOString(),
      };

      if (useMockClient) {
        const current = this.inMemoryDb.get(existing.id);
        const updated = { ...current, ...record };
        this.inMemoryDb.set(existing.id, updated);
        return this._mapStudent(updated);
      }

      const { data, error } = await this.client
        .from(this.table)
        .update(record)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to update student: ${error.message}`, error);
      return this._mapStudent(data);
    } else {
      return this.createStudent(studentData);
    }
  }
}

module.exports = SupabaseStudentRepository;
