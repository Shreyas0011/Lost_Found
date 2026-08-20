const express = require('express');
const SupabaseMessageRepository = require('../repositories/supabaseMessageRepository');
const SupabaseClaimRepository = require('../repositories/supabaseClaimRepository');
const { authenticateAny } = require('../middleware/auth');

const messageRepo = new SupabaseMessageRepository();
const claimRepo = new SupabaseClaimRepository();
const router = express.Router();

// GET /api/messages/:requestId — Load chat history for a request
router.get('/:requestId', authenticateAny, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify the request exists
    const claim = await claimRepo.getClaimById(requestId, false);
    if (!claim) return res.status(404).json({ error: 'Request not found.' });

    // Students may only view their own chat
    const studentIdStr = typeof claim.student_id === 'object' ? claim.student_id.id : claim.student_id;
    if (req.user.role === 'student' && studentIdStr !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const messages = await messageRepo.getMessagesByRequestId(requestId);
    return res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages/:requestId — Send a message (REST fallback; Socket.IO is primary)
router.post('/:requestId', authenticateAny, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const claim = await claimRepo.getClaimById(requestId, false);
    if (!claim) return res.status(404).json({ error: 'Request not found.' });

    const studentIdStr = typeof claim.student_id === 'object' ? claim.student_id.id : claim.student_id;
    if (req.user.role === 'student' && studentIdStr !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const msg = await messageRepo.createMessage({
      request_id: requestId,
      sender_id: req.user.id || 'admin',
      sender_role: req.user.role,
      message: message.trim(),
    });

    return res.status(201).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
