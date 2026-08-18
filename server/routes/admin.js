const express = require('express');
const Item = require('../models/Item');
const OwnershipRequest = require('../models/OwnershipRequest');
const OwnershipMessage = require('../models/OwnershipMessage');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats — Dashboard summary stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalItems,
      publishedItems,
      unclaimedItems,
      claimedItems,
      donatedItems,
      deactivatedItems,
      ownershipRequests,
      pendingRequests,
      expiringSoon,
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ status: 'PUBLISHED' }),
      Item.countDocuments({ status: 'UNCLAIMED' }),
      Item.countDocuments({ status: 'CLAIMED' }),
      Item.countDocuments({ status: 'DONATED' }),
      Item.countDocuments({ status: 'DEACTIVATED' }),
      OwnershipRequest.countDocuments(),
      OwnershipRequest.countDocuments({ status: 'PENDING' }),
      Item.countDocuments({
        status: 'PUBLISHED',
        uploaded_at: {
          $lte: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // within 7 days of expiry
        },
      }),
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
      expiringSoon,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
