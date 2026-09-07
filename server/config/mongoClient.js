const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function getMongoDb() {
  if (db) return db;
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shreyas777:Shreyas2004@hostelp.gmlzm5p.mongodb.net/lost_found?appName=HostelP';
  try {
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db('lost_found');
    console.log('✅ Singleton MongoDB client connected to database: lost_found');
    return db;
  } catch (err) {
    console.error('❌ Singleton MongoDB connection error:', err.message);
    client = null;
    db = null;
    return null;
  }
}

module.exports = { getMongoDb };
