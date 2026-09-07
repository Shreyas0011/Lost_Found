const { getMongoDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

function buildIdQuery(id) {
  if (!id) return { _id: null };
  const queries = [{ id: id }, { _id: id }];
  if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
    queries.push({ _id: new ObjectId(id) });
  }
  return { $or: queries };
}

class MongoClaimRepository {
  async _getCollection() {
    const db = await getMongoDb();
    if (!db) throw new Error('MongoDB lost_found database not connected.');
    return db.collection('ownership_requests');
  }

  async _mapClaim(record, populateStudent = false) {
    if (!record) return null;
    const id = record.id || record._id?.toString();

    let studentObj = record.student_id;
    if (populateStudent && typeof record.student_id === 'string') {
      try {
        const db = await getMongoDb();
        const studentDoc = await db.collection('students').findOne(buildIdQuery(record.student_id));
        if (studentDoc) {
          studentObj = {
            id: studentDoc.id || studentDoc._id?.toString(),
            name: studentDoc.name,
            registration_number: studentDoc.registration_number,
            email: studentDoc.email,
            class: studentDoc.class,
            section: studentDoc.section,
          };
        }
      } catch (e) {}
    }

    return {
      id,
      _id: id,
      item_id: record.item_id,
      student_id: studentObj,
      message: record.message || '',
      status: record.status || 'PENDING',
      in_person_preferred_date: record.in_person_preferred_date || record.in_person_request?.preferred_date || null,
      in_person_preferred_time: record.in_person_preferred_time || record.in_person_request?.preferred_time || '',
      in_person_note: record.in_person_note || record.in_person_request?.note || '',
      in_person_status: record.in_person_status || record.in_person_request?.status || null,
      in_person_request: record.in_person_request || {
        preferred_date: record.in_person_preferred_date,
        preferred_time: record.in_person_preferred_time,
        note: record.in_person_note,
        status: record.in_person_status,
      },
      createdAt: record.createdAt || record.created_at,
      updatedAt: record.updatedAt || record.updated_at,
    };
  }

  async createClaim(claimData) {
    const collection = await this._getCollection();
    const id = claimData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      item_id: claimData.item_id,
      student_id: typeof claimData.student_id === 'object' ? claimData.student_id.id : claimData.student_id,
      message: claimData.message || '',
      status: claimData.status || 'PENDING',
      in_person_preferred_date: claimData.in_person_preferred_date || claimData.in_person_request?.preferred_date || null,
      in_person_preferred_time: claimData.in_person_preferred_time || claimData.in_person_request?.preferred_time || '',
      in_person_note: claimData.in_person_note || claimData.in_person_request?.note || '',
      in_person_status: claimData.in_person_status || claimData.in_person_request?.status || null,
      in_person_request: claimData.in_person_request || {},
      updatedAt: claimData.updatedAt || now,
    };

    await collection.updateOne(
      { id: id },
      { $set: record, $setOnInsert: { _id: id, createdAt: claimData.createdAt || now } },
      { upsert: true }
    );

    return this._mapClaim(record, false);
  }

  async getClaimById(id, populateStudent = false) {
    if (!id) return null;
    const collection = await this._getCollection();
    const doc = await collection.findOne(buildIdQuery(id));
    return this._mapClaim(doc, populateStudent);
  }

  async getAllClaims(filter = {}) {
    const collection = await this._getCollection();
    const query = {};

    if (filter.item_id) query.item_id = filter.item_id;
    if (filter.status) query.status = filter.status;
    if (filter.student_id) query.student_id = filter.student_id;

    const docs = await collection.find(query).sort({ createdAt: -1 }).toArray();
    return Promise.all(docs.map((d) => this._mapClaim(d, true)));
  }

  async getClaimsByStudent(studentId) {
    return this.getAllClaims({ student_id: studentId });
  }

  async findClaimByItemAndStudent(itemId, studentId) {
    const collection = await this._getCollection();
    const doc = await collection.findOne({
      item_id: itemId,
      student_id: studentId,
    });
    return this._mapClaim(doc, false);
  }

  async updateClaim(id, updateData) {
    if (!id) return null;
    const collection = await this._getCollection();
    const now = new Date().toISOString();

    const record = { updatedAt: now };
    const fields = [
      'status', 'message', 'in_person_preferred_date', 'in_person_preferred_time',
      'in_person_note', 'in_person_status', 'in_person_request'
    ];

    fields.forEach((f) => {
      if (updateData[f] !== undefined) {
        record[f] = updateData[f];
      }
    });

    await collection.updateOne(
      buildIdQuery(id),
      { $set: record }
    );

    return this.getClaimById(id, true);
  }

  async deleteClaimsByItem(itemId) {
    if (!itemId) return { success: false };
    const collection = await this._getCollection();
    const res = await collection.deleteMany({ item_id: itemId });
    return { success: true, count: res.deletedCount };
  }

  async countClaims(filter = {}) {
    const collection = await this._getCollection();
    const query = {};
    if (filter.status) query.status = filter.status;
    return await collection.countDocuments(query);
  }
}

module.exports = MongoClaimRepository;
