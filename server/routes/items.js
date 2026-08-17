const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const { authenticateStudent, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/items — Search published items (public)
router.get('/', async (req, res) => {
  try {
    const { category, brand, color, size, location_found, date_from, date_to, q } = req.query;
    const filter = { status: 'PUBLISHED' };

    if (category) filter.category = category;
    if (location_found) filter.location_found = location_found;
    if (color) filter.color = new RegExp(color, 'i');
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (size) filter.size = new RegExp(size, 'i');
    if (date_from || date_to) {
      filter.date_found = {};
      if (date_from) filter.date_found.$gte = new Date(date_from);
      if (date_to) filter.date_found.$lte = new Date(date_to);
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const items = await Item.find(filter).sort({ uploaded_at: -1 }).select('-__v');
    return res.json({ items });
  } catch (err) {
    console.error('Get items error:', err);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// GET /api/items/:id — Single item detail (public)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select('-__v');
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This item is not publicly available.' });
    }
    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// ─── STUDENT ─────────────────────────────────────────────────────────────────

// POST /api/items — Submit found item (student)
router.post('/', authenticateStudent, upload.single('image'), async (req, res) => {
  try {
    const {
      category, brand, color, size, location_found,
      date_found, time_found, description,
    } = req.body;

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : '';
    const imageFilename = req.file ? req.file.filename : '';

    const item = new Item({
      category,
      brand,
      color,
      size,
      location_found,
      date_found: new Date(date_found),
      time_found,
      description,
      image_url: imageUrl,
      image_filename: imageFilename,
      submitted_by: req.student.id,
      registration_number: req.student.registration_number,
      student_name: req.student.name,
      status: 'PENDING',
    });

    await item.save();
    return res.status(201).json({ message: 'Item submitted successfully.', item });
  } catch (err) {
    console.error('Submit item error:', err);
    return res.status(500).json({ error: 'Failed to submit item.' });
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// GET /api/items/admin/all — All items for admin
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const items = await Item.find(filter).sort({ uploaded_at: -1 }).select('-__v');
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// PATCH /api/items/admin/:id/status — Change item status
router.patch('/admin/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['PUBLISHED', 'UNPUBLISHED', 'RETURNED', 'EXPIRED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    return res.json({ message: 'Status updated.', item });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE /api/items/admin/:id — Delete item + image
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Delete image file
    if (item.image_filename) {
      const imgPath = path.join(__dirname, '..', 'uploads', item.image_filename);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Item.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
