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

class MongoItemRepository {
  async _getCollection() {
    const db = await getMongoDb();
    if (!db) throw new Error('MongoDB lost_found database not connected.');
    return db.collection('items');
  }

  _mapItem(record) {
    if (!record) return null;
    const id = record.id || record._id?.toString();
    return {
      id,
      _id: id,
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
      uploaded_at: record.uploaded_at || record.createdAt,
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
      createdAt: record.createdAt || record.created_at,
      updatedAt: record.updatedAt || record.updated_at,
    };
  }

  async createItem(itemData) {
    const collection = await this._getCollection();
    const id = itemData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      serial_number: itemData.serial_number,
      uid: itemData.uid,
      category: itemData.category,
      who_found: itemData.who_found || '',
      location_found: itemData.location_found,
      date_found: itemData.date_found ? new Date(itemData.date_found).toISOString() : now,
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
      updatedAt: itemData.updatedAt || now,
    };

    await collection.updateOne(
      buildIdQuery(id),
      { $set: record, $setOnInsert: { _id: id, createdAt: itemData.createdAt || now } },
      { upsert: true }
    );

    return this._mapItem(record);
  }

  async getItemById(id) {
    if (!id) return null;
    const collection = await this._getCollection();
    const doc = await collection.findOne(buildIdQuery(id));
    return this._mapItem(doc);
  }

  async findItems(filter = {}) {
    const collection = await this._getCollection();
    const query = {};

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        query.status = { $in: filter.status };
      } else if (typeof filter.status === 'object' && filter.status.$in) {
        query.status = { $in: filter.status.$in };
      } else {
        query.status = filter.status;
      }
    }

    if (filter.category) {
      if (Array.isArray(filter.category)) {
        query.category = { $in: filter.category };
      } else if (typeof filter.category === 'object' && filter.category.$in) {
        query.category = { $in: filter.category.$in };
      } else {
        query.category = filter.category;
      }
    }

    if (filter.location_found) {
      if (Array.isArray(filter.location_found)) {
        query.location_found = { $in: filter.location_found };
      } else if (typeof filter.location_found === 'object' && filter.location_found.$in) {
        query.location_found = { $in: filter.location_found.$in };
      } else {
        query.location_found = filter.location_found;
      }
    }

    if (filter.student_name) {
      if (Array.isArray(filter.student_name)) {
        query.student_name = { $in: filter.student_name };
      } else {
        query.student_name = filter.student_name;
      }
    }

    if (filter.serial_number) {
      if (Array.isArray(filter.serial_number)) {
        query.$or = query.$or || [];
        query.$or.push(
          { serial_number: { $in: filter.serial_number } },
          { uid: { $in: filter.serial_number } }
        );
      } else {
        query.$or = query.$or || [];
        query.$or.push(
          { serial_number: filter.serial_number },
          { uid: filter.serial_number }
        );
      }
    }

    if (filter.date_from || filter.date_to) {
      query.date_found = query.date_found || {};
      if (filter.date_from) {
        query.date_found.$gte = new Date(filter.date_from).toISOString();
      }
      if (filter.date_to) {
        const dt = new Date(filter.date_to);
        dt.setHours(23, 59, 59, 999);
        query.date_found.$lte = dt.toISOString();
      }
    }

    if (filter.q) {
      const escaped = String(filter.q).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const reg = new RegExp(escaped, 'i');
      const qConditions = [
        { serial_number: reg },
        { uid: reg },
        { category: reg },
        { location_found: reg },
        { description: reg },
        { who_found: reg },
        { student_name: reg },
        { registration_number: reg },
      ];
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: qConditions }
        ];
        delete query.$or;
      } else {
        query.$or = qConditions;
      }
    }

    const docs = await collection.find(query).sort({ uploaded_at: -1, createdAt: -1 }).toArray();
    return docs.map((d) => this._mapItem(d));
  }

  async updateItem(id, updateData) {
    if (!id) return null;
    const collection = await this._getCollection();
    const now = new Date().toISOString();

    const record = { updatedAt: now };
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

    await collection.updateOne(
      buildIdQuery(id),
      { $set: record }
    );

    return this.getItemById(id);
  }

  async deleteItem(id) {
    if (!id) return { success: false };
    const collection = await this._getCollection();
    const res = await collection.deleteOne(buildIdQuery(id));
    return { success: res.deletedCount > 0 };
  }

  async countItems(filter = {}) {
    const collection = await this._getCollection();
    const query = {};

    if (filter.status) {
      if (typeof filter.status === 'object' && filter.status.$nin) {
        query.status = { $nin: filter.status.$nin };
      } else {
        query.status = filter.status;
      }
    }

    if (filter.uploaded_at && filter.uploaded_at.$lte) {
      const isoCutoff = new Date(filter.uploaded_at.$lte).toISOString();
      query.$or = [{ uploaded_at: { $lte: isoCutoff } }, { createdAt: { $lte: isoCutoff } }];
    }

    return await collection.countDocuments(query);
  }

  async getExpiringItems(cutoffDate) {
    const collection = await this._getCollection();
    const isoCutoff = new Date(cutoffDate).toISOString();

    const docs = await collection.find({
      status: { $nin: ['CLAIMED', 'RETURNED', 'EXPIRED', 'DONATED'] },
      $or: [{ uploaded_at: { $lt: isoCutoff } }, { createdAt: { $lt: isoCutoff } }],
    }).toArray();

    return docs.map((d) => this._mapItem(d));
  }
}

module.exports = MongoItemRepository;
