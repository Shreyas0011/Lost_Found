const MongoItemRepository = require('../repositories/mongoItemRepository');
const { getMongoDb } = require('../config/mongoClient');

const itemRepo = new MongoItemRepository();

/**
 * Checks for unclaimed items older than 30 days and automatically moves them to the DONATED catalogue.
 * DONATED items are excluded from the public student catalogue and are visible ONLY to Admins.
 * Target Database: MongoDB lost_found database only.
 */
async function autoDonateUnclaimedItems() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isoCutoff = thirtyDaysAgo.toISOString();

    let totalDonatedCount = 0;

    // Process via MongoDB lost_found database
    const db = await getMongoDb();
    if (db) {
      const itemsCol = db.collection('items');
      const mongoResult = await itemsCol.updateMany(
        {
          status: { $in: ['PUBLISHED', 'UNCLAIMED'] },
          $or: [
            { uploaded_at: { $lte: isoCutoff } },
            { createdAt: { $lte: isoCutoff } },
            { date_found: { $lte: isoCutoff } },
          ],
        },
        {
          $set: {
            status: 'DONATED',
            updatedAt: new Date().toISOString(),
          },
        }
      );

      if (mongoResult.modifiedCount > 0) {
        console.log(`📦 MongoDB lost_found: ${mongoResult.modifiedCount} unclaimed item(s) moved to DONATED catalogue.`);
        totalDonatedCount += mongoResult.modifiedCount;
      }
    }

    return totalDonatedCount;
  } catch (err) {
    console.error('❌ Auto-donate error:', err.message);
    return 0;
  }
}

module.exports = { autoDonateUnclaimedItems };
