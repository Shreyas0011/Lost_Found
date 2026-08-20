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
let storedFormFields = {
  categories: ['Electronics', 'Clothing', 'Books', 'ID / Cards', 'Accessories', 'Bags', 'Keys', 'Stationery', 'Other'],
  locations: ['Library', 'Cafeteria', 'Classroom', 'Hostel', 'Parking', 'Sports Area', 'Administrative Block', 'Other'],
  customFields: [
    { id: 'cf_1', name: 'Security Locker ID', type: 'text', placeholder: 'e.g. Locker #4B', required: false },
    { id: 'cf_2', name: 'Found Item Tags', type: 'text', placeholder: 'e.g. #valuable, #fragile', required: false }
  ]
};

// GET /api/admin/form-fields — Retrieve current admin form fields schema
router.get('/form-fields', (req, res) => {
  return res.json(storedFormFields);
});

// PUT /api/admin/form-fields — Update admin form fields schema (SuperAdmin)
router.put('/form-fields', (req, res) => {
  if (req.body && req.body.categories && req.body.locations) {
    storedFormFields = req.body;
  }
  return res.json({ message: 'Form fields schema updated successfully', formFields: storedFormFields });
});

module.exports = router;
