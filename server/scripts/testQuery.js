const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');

async function testIdQuery() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('lost_found');
  const itemsCol = db.collection('items');

  const id = '6a91157a8e6ebb571daa4b44';
  const orList = [{ id: id }, { _id: id }];
  if (ObjectId.isValid(id) && id.length === 24) {
    orList.push({ _id: new ObjectId(id) });
  }

  const item = await itemsCol.findOne({ $or: orList });
  console.log(`QueryResult for '${id}':`, item ? `FOUND! Serial: ${item.serial_number}, Category: ${item.category}` : 'NOT FOUND');
  await client.close();
}

testIdQuery();
