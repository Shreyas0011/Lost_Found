const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const { getMongoDb } = require('../config/mongoClient');

const itemRepo = new SupabaseItemRepository();

/**
 * Checks for unclaimed items older than 30 days and automatically moves them to the DONATED catalogue.
 * DONATED items are excluded from the public student catalogue and are visible ONLY to Admins.
 */
async function autoDonateUnclaimedItems() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    console.log('🔄 Checking for unclaimed items older than 30 days to move to Donated Catalogue...');

    let totalDonatedCount = 0;

    // 1. Process via SupabaseItemRepository
    try {
      const allItems = await itemRepo.findItems({});
      for (const item of allItems) {
        const itemDate = new Date(item.uploaded_at || item.createdAt || item.date_found);
        if (
          itemDate < thirtyDaysAgo &&
          (item.status === 'PUBLISHED' || item.status === 'UNCLAIMED')
        ) {
          await itemRepo.updateItem(item.id, { status: 'DONATED' });
          console.log(`  📦 Item ${item.serial_number || item.id} (${item.category}) auto-moved to DONATED catalogue.`);
          totalDonatedCount++;
        }
      }
    } catch (supaErr) {
      console.warn('Supabase auto-donate note:', supaErr.message);
    }

    // 2. Process via MongoDB lost_found database (if MONGODB_URI is configured)
    if (process.env.MONGODB_URI) {
      try {
        const db = await getMongoDb();
        if (db) {
          const itemsCol = db.collection('items');
          const mongoResult = await itemsCol.updateMany(
            {
              status: { $in: ['PUBLISHED', 'UNCLAIMED'] },
              $or: [
                { uploaded_at: { $lte: thirtyDaysAgo.toISOString() } },
                { createdAt: { $lte: thirtyDaysAgo.toISOString() } },
                { date_found: { $lte: thirtyDaysAgo.toISOString() } },
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
            console.log(`  📦 MongoDB: ${mongoResult.modifiedCount} unclaimed item(s) auto-moved to DONATED catalogue.`);
            totalDonatedCount += mongoResult.modifiedCount;
          }
        }
      } catch (mongoErr) {
        console.warn('MongoDB auto-donate note:', mongoErr.message);
      }
    }

    return totalDonatedCount;
  } catch (err) {
    console.error('❌ Auto-donate error:', err.message);
    return 0;
  }
}

module.exports = { autoDonateUnclaimedItems };
