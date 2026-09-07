const { getMongoDb } = require('../config/mongoClient');
const crypto = require('crypto');

class MongoMessageRepository {
  async _getCollection() {
    const db = await getMongoDb();
    if (!db) throw new Error('MongoDB lost_found database not connected.');
    return db.collection('ownership_messages');
  }

  _mapMessage(doc) {
    if (!doc) return null;
    const id = doc.id || doc._id?.toString();
    return {
      id,
      _id: id,
      request_id: doc.request_id,
      sender_id: doc.sender_id,
      sender_role: doc.sender_role,
      message: doc.message || '',
      createdAt: doc.createdAt || doc.created_at,
      updatedAt: doc.updatedAt || doc.updated_at,
    };
  }

  async createMessage(msgData) {
    const collection = await this._getCollection();
    const id = msgData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const doc = {
      id,
      request_id: msgData.request_id,
      sender_id: msgData.sender_id,
      sender_role: msgData.sender_role,
      message: (msgData.message || '').trim(),
      updatedAt: msgData.updatedAt || now,
    };

    await collection.updateOne(
      { id: id },
      { $set: doc, $setOnInsert: { _id: id, createdAt: msgData.createdAt || now } },
      { upsert: true }
    );

    return this._mapMessage(doc);
  }

  async getMessagesByRequestId(requestId) {
    if (!requestId) return [];
    const collection = await this._getCollection();
    const docs = await collection.find({ request_id: requestId }).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => this._mapMessage(d));
  }

  async deleteMessagesByRequestId(requestId) {
    if (!requestId) return { success: false };
    const collection = await this._getCollection();
    const res = await collection.deleteMany({ request_id: requestId });
    return { success: true, count: res.deletedCount };
  }
}

module.exports = MongoMessageRepository;
