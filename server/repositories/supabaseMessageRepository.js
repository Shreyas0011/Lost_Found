const crypto = require('crypto');
const { supabaseAdmin, useMockClient } = require('../infrastructure/supabase/supabaseClient');
const { DatabaseError } = require('../errors/AppErrors');

class SupabaseMessageRepository {
  constructor(client = supabaseAdmin) {
    this.client = client;
    this.table = 'ownership_messages';
    this.inMemoryDb = new Map();
  }

  _mapMessage(record) {
    if (!record) return null;
    return {
      id: record.id,
      _id: record.id,
      request_id: record.request_id,
      sender_id: record.sender_id,
      sender_role: record.sender_role,
      message: record.message,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async createMessage(messageData) {
    const id = messageData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      request_id: messageData.request_id,
      sender_id: String(messageData.sender_id),
      sender_role: messageData.sender_role,
      message: (messageData.message || '').trim(),
      created_at: messageData.createdAt || now,
      updated_at: messageData.updatedAt || now,
    };

    if (useMockClient) {
      this.inMemoryDb.set(id, record);
      return this._mapMessage(record);
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert([record])
        .select()
        .single();

      if (error) throw new DatabaseError(`Failed to insert message: ${error.message}`, error);
      return this._mapMessage(data);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Message creation error: ${err.message}`, err);
    }
  }

  async getMessagesByRequestId(requestId) {
    if (useMockClient) {
      const all = Array.from(this.inMemoryDb.values())
        .filter((m) => m.request_id === requestId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return all.map((r) => this._mapMessage(r));
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw new DatabaseError(`Failed to fetch messages: ${error.message}`, error);
      return (data || []).map((r) => this._mapMessage(r));
    } catch (err) {
      return [];
    }
  }

  async deleteMessagesByRequestId(requestId) {
    if (useMockClient) {
      const toDelete = Array.from(this.inMemoryDb.values()).filter((m) => m.request_id === requestId);
      toDelete.forEach((m) => this.inMemoryDb.delete(m.id));
      return { success: true };
    }

    try {
      const { error } = await this.client.from(this.table).delete().eq('request_id', requestId);
      if (error) throw new DatabaseError(`Failed to delete messages: ${error.message}`, error);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}

module.exports = SupabaseMessageRepository;
