const express = require('express');
const OwnershipRequest = require('../models/OwnershipRequest');
const Item = require('../models/Item');
const { authenticateStudent, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/claims — Create ownership request (student)
router.post('/', authenticateStudent, async (req, res) => {
  try {
    const { item_id, message } = req.body;

    if (!item_id || !message) {
      return res.status(400).json({ error: 'item_id and message are required.' });
    }

    const item = await Item.findById(item_id);
    if (!item || item.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Item not found or not available for claims.' });
    }

    // Check for duplicate claim by same student
    const existing = await OwnershipRequest.findOne({
      item_id,
      student_id: req.student.id,
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a claim for this item.' });
    }

    const claim = new OwnershipRequest({
      item_id,
      student_id: req.student.id,
      message,
      status: 'PENDING',
    });

    await claim.save();
    return res.status(201).json({ message: 'Ownership request submitted.', claim });
  } catch (err) {
    console.error('Create claim error:', err);
    return res.status(500).json({ error: 'Failed to submit claim.' });
  }
});

// GET /api/claims/my — Student's own claims
router.get('/my', authenticateStudent, async (req, res) => {
  try {
    const claims = await OwnershipRequest.find({ student_id: req.student.id })
      .populate('item_id', 'category brand color location_found date_found image_url status')
      .sort({ createdAt: -1 });
    return res.json({ claims });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// GET /api/claims/:id — Single claim detail (student or admin)
router.get('/:id', authenticateStudent, async (req, res) => {
  try {
    const claim = await OwnershipRequest.findById(req.params.id)
      .populate('item_id')
      .populate('student_id', 'name registration_number email class section');

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    // Student can only view their own claim
    if (claim.student_id._id.toString() !== req.student.id) {
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
    const claim = await OwnershipRequest.findById(req.params.id);

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    if (claim.student_id.toString() !== req.student.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    claim.in_person_request = {
      preferred_date: new Date(preferred_date),
      preferred_time,
      note: note || '',
      status: 'REQUESTED',
    };

    await claim.save();
    return res.json({ message: 'In-person verification requested.', claim });
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

    const claims = await OwnershipRequest.find(filter)
      .populate('item_id', 'category brand color location_found date_found image_url status')
      .populate('student_id', 'name registration_number email class section')
      .sort({ createdAt: -1 });

    return res.json({ claims });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// GET /api/claims/admin/:id — Single claim for admin
router.get('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const claim = await OwnershipRequest.findById(req.params.id)
      .populate('item_id')
      .populate('student_id', 'name registration_number email class section');
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

    const claim = await OwnershipRequest.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    claim.status = status;
    await claim.save();

    // If approved, update item status to CLAIMED
    if (status === 'APPROVED') {
      await Item.findByIdAndUpdate(claim.item_id, { status: 'CLAIMED' });
    }

    return res.json({ message: `Claim ${status.toLowerCase()}.`, claim });
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

    const claim = await OwnershipRequest.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    claim.in_person_request.status = status;
    await claim.save();

    return res.json({ message: 'Meeting status updated.', claim });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update meeting status.' });
  }
});

module.exports = router;
