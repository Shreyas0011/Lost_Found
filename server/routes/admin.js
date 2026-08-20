const express = require('express');
const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const SupabaseClaimRepository = require('../repositories/supabaseClaimRepository');
const { authenticateAdmin } = require('../middleware/auth');

const itemRepo = new SupabaseItemRepository();
const claimRepo = new SupabaseClaimRepository();
const router = express.Router();

// GET /api/admin/stats — Dashboard summary stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const cutoffDate = new Date(Date.now() - 23 * 24 * 60 * 60 * 1000);

    const [
      totalItems,
      publishedItems,
      unclaimedItems,
      claimedItems,
      donatedItems,
      deactivatedItems,
      ownershipRequests,
      pendingRequests,
      expiringSoonList,
    ] = await Promise.all([
      itemRepo.countItems({}),
      itemRepo.countItems({ status: 'PUBLISHED' }),
      itemRepo.countItems({ status: 'UNCLAIMED' }),
      itemRepo.countItems({ status: 'CLAIMED' }),
      itemRepo.countItems({ status: 'DONATED' }),
      itemRepo.countItems({ status: 'DEACTIVATED' }),
      claimRepo.countClaims({}),
      claimRepo.countClaims({ status: 'PENDING' }),
      itemRepo.getExpiringItems(cutoffDate),
    ]);

    return res.json({
      totalItems,
      publishedItems,
      unclaimedItems,
      claimedItems,
      donatedItems,
      deactivatedItems,
      ownershipRequests,
      pendingRequests,
      expiringSoon: expiringSoonList.length,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
