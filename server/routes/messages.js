const express = require('express');
const OwnershipMessage = require('../models/OwnershipMessage');
const OwnershipRequest = require('../models/OwnershipRequest');
const { authenticateStudent, authenticateAdmin, authenticateAny } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:requestId — Load chat history for a request
router.get('/:requestId', authenticateAny, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify the request exists
    const claim = await OwnershipRequest.findById(requestId);
    if (!claim) return res.status(404).json({ error: 'Request not found.' });

    // Students may only view their own chat
    if (req.user.role === 'student' && claim.student_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const messages = await OwnershipMessage.find({ request_id: requestId })
      .sort({ createdAt: 1 });

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

    const claim = await OwnershipRequest.findById(requestId);
    if (!claim) return res.status(404).json({ error: 'Request not found.' });

    if (req.user.role === 'student' && claim.student_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const msg = new OwnershipMessage({
      request_id: requestId,
      sender_id: req.user.id || 'admin',
      sender_role: req.user.role,
      message: message.trim(),
    });

    await msg.save();
    return res.status(201).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
