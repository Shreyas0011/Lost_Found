const express = require('express');
const SupabaseClaimRepository = require('../repositories/supabaseClaimRepository');
const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const { authenticateStudent, authenticateAdmin } = require('../middleware/auth');

const claimRepo = new SupabaseClaimRepository();
const itemRepo = new SupabaseItemRepository();
const router = express.Router();

// POST /api/claims — Create ownership request (student)
router.post('/', authenticateStudent, async (req, res) => {
  try {
    const { item_id, message } = req.body;

    if (!item_id || !message) {
      return res.status(400).json({ error: 'item_id and message are required.' });
    }

    const item = await itemRepo.getItemById(item_id);
    if (!item || item.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Item not found or not available for claims.' });
    }

    // Check for duplicate claim by same student
    const existing = await claimRepo.findClaimByItemAndStudent(item_id, req.student.id);
    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a claim for this item.' });
    }

    const claim = await claimRepo.createClaim({
      item_id,
      student_id: req.student.id,
      message,
      status: 'PENDING',
    });

    return res.status(201).json({ message: 'Ownership request submitted.', claim });
  } catch (err) {
    console.error('Create claim error:', err);
    return res.status(500).json({ error: 'Failed to submit claim.' });
  }
});

// GET /api/claims/my — Student's own claims
router.get('/my', authenticateStudent, async (req, res) => {
  try {
    const claims = await claimRepo.getClaimsByStudent(req.student.id);
    return res.json({ claims });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// GET /api/claims/:id — Single claim detail (student or admin)
router.get('/:id', authenticateStudent, async (req, res) => {
  try {
    const claim = await claimRepo.getClaimById(req.params.id, true);

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    // Student can only view their own claim
    const studentIdStr = typeof claim.student_id === 'object' ? claim.student_id.id : claim.student_id;
    if (studentIdStr !== req.student.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json({ claim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claim.' });
  }
});

// POST /api/claims/:id/inperson — Request in-person verification (student)
router.post('/:id/inperson', authenticateStudent, async (req, res) => {
  try {
    const { preferred_date, preferred_time, note } = req.body;
    const claim = await claimRepo.getClaimById(req.params.id, false);

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    const studentIdStr = typeof claim.student_id === 'object' ? claim.student_id.id : claim.student_id;
    if (studentIdStr !== req.student.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatedClaim = await claimRepo.updateClaim(req.params.id, {
      in_person_request: {
        preferred_date: new Date(preferred_date),
        preferred_time: preferred_time || '',
        note: note || '',
        status: 'REQUESTED',
      },
    });

    return res.json({ message: 'In-person verification requested.', claim: updatedClaim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to request in-person verification.' });
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/claims/admin/all — All claims
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const claims = await claimRepo.getAllClaims(filter);
    return res.json({ claims });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// GET /api/claims/admin/:id — Single claim for admin
router.get('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const claim = await claimRepo.getClaimById(req.params.id, true);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    return res.json({ claim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claim.' });
  }
});

// PATCH /api/claims/admin/:id/status — Approve or reject claim
router.patch('/admin/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
    }

    const claim = await claimRepo.getClaimById(req.params.id, false);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    const updatedClaim = await claimRepo.updateClaim(req.params.id, { status });

    // If approved, update item status to CLAIMED
    if (status === 'APPROVED') {
      const itemIdStr = typeof claim.item_id === 'object' ? claim.item_id.id : claim.item_id;
      await itemRepo.updateItem(itemIdStr, { status: 'CLAIMED' });
    }

    return res.json({ message: `Claim ${status.toLowerCase()}.`, claim: updatedClaim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update claim status.' });
  }
});

// PATCH /api/claims/admin/:id/meeting — Update in-person meeting status
router.patch('/admin/:id/meeting', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid meeting status.' });
    }

    const claim = await claimRepo.getClaimById(req.params.id, false);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    const updatedClaim = await claimRepo.updateClaim(req.params.id, {
      in_person_request: {
        ...claim.in_person_request,
        status,
      },
    });

    return res.json({ message: 'Meeting status updated.', claim: updatedClaim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update meeting status.' });
  }
});

module.exports = router;
