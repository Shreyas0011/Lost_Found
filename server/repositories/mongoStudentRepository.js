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

class MongoStudentRepository {
  async _getCollection() {
    const db = await getMongoDb();
    if (!db) throw new Error('MongoDB lost_found database not connected.');
    return db.collection('students');
  }

  _mapStudent(doc) {
    if (!doc) return null;
    const id = doc.id || doc._id?.toString();
    return {
      id,
      _id: id,
      registration_number: doc.registration_number,
      name: doc.name,
      email: doc.email,
      class: doc.class,
      section: doc.section,
      parent_name: doc.parent_name || '',
      parent_email: doc.parent_email || '',
      status: doc.status || 'active',
      createdAt: doc.createdAt || doc.created_at,
      updatedAt: doc.updatedAt || doc.updated_at,
    };
  }

  async findByRegistrationNumber(registrationNumber) {
    if (!registrationNumber) return null;
    const collection = await this._getCollection();
    const doc = await collection.findOne({
      registration_number: registrationNumber.trim().toUpperCase(),
    });
    return this._mapStudent(doc);
  }

  async findById(id) {
    if (!id) return null;
    const collection = await this._getCollection();
    const doc = await collection.findOne(buildIdQuery(id));
    return this._mapStudent(doc);
  }

  async createStudent(studentData) {
    const collection = await this._getCollection();
    const id = studentData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const doc = {
      id,
      registration_number: (studentData.registration_number || '').trim().toUpperCase(),
      name: (studentData.name || '').trim(),
      email: (studentData.email || '').trim().toLowerCase(),
      class: studentData.class || '',
      section: studentData.section || '',
      parent_name: studentData.parent_name || '',
      parent_email: studentData.parent_email || '',
      status: studentData.status || 'active',
      updatedAt: studentData.updatedAt || now,
    };

    await collection.updateOne(
      { registration_number: doc.registration_number },
      { $set: doc, $setOnInsert: { _id: id, createdAt: studentData.createdAt || now } },
      { upsert: true }
    );

    return this._mapStudent(doc);
  }

  async upsertStudent(studentData) {
    return this.createStudent(studentData);
  }

  async getAllStudents() {
    const collection = await this._getCollection();
    const docs = await collection.find({}).toArray();
    return docs.map((d) => this._mapStudent(d));
  }
}

module.exports = MongoStudentRepository;
