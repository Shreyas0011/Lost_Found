const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const { authenticateStudent, authenticateAdmin } = require('../middleware/auth');
const AssetService = require('../services/assetService');

const itemRepo = new SupabaseItemRepository();
const assetService = new AssetService();
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
    const allowedExts = /jpeg|jpg|png|gif|webp|pdf/;
    const allowedMimes = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf/;
    const ext = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedMimes.test(file.mimetype.toLowerCase());
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) and PDF documents are allowed.'));
  },
});

// Helper function to build multi-select $in query
function parseMultiQuery(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.includes(',')) {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return val;
}

// GET /api/items — Search published items (public)
router.get('/', async (req, res) => {
  try {
    const { category, location_found, date_from, date_to, q } = req.query;
    const filter = { status: 'PUBLISHED' };

    if (category) filter.category = parseMultiQuery(category);
    if (location_found) filter.location_found = parseMultiQuery(location_found);
    if (q) filter.q = q;

    const items = await itemRepo.findItems(filter);
    return res.json({ items });
  } catch (err) {
    console.error('Get items error:', err);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// GET /api/items/:id — Single item detail (public)
router.get('/:id', async (req, res) => {
  try {
    const item = await itemRepo.getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.status !== 'PUBLISHED' && item.status !== 'DEACTIVATED') {
      return res.status(403).json({ error: 'This item is not publicly available.' });
    }
    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// POST /api/items — Submit found item (student)
router.post('/', authenticateStudent, upload.single('image'), async (req, res) => {
  try {
    const {
      category, who_found, location_found,
      date_found, time_found, description,
    } = req.body;

    let imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    let imageFilename = req.file ? req.file.filename : '';
    let assetId = null;

    const serial_number = `LF-${Math.floor(10000 + Math.random() * 90000)}`;
    const uid = `UID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const asset = await assetService.uploadAsset({
          fileBuffer,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          ownerId: req.student.id,
          entityType: 'item',
          entityId: serial_number,
        });
        if (asset && asset.url) {
          imageUrl = asset.url;
          assetId = asset.id;
        }
      } catch (assetErr) {
        console.warn('Supabase Asset upload fallback to local disk:', assetErr.message);
      }
    }

    const item = await itemRepo.createItem({
      serial_number,
      uid,
      category,
      who_found: who_found || '',
      location_found,
      date_found: new Date(date_found),
      time_found,
      description,
      image_url: imageUrl,
      image_filename: imageFilename,
      asset_id: assetId,
      submitted_by: req.student.id,
      registration_number: req.student.registration_number,
      student_name: req.student.name,
      status: 'PUBLISHED',
    });

    return res.status(201).json({ message: 'Item submitted successfully.', item });
  } catch (err) {
    console.error('Submit item error:', err);
    return res.status(500).json({ error: 'Failed to submit item.' });
  }
});

// GET /api/items/admin/all — All items for admin
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status, category, location_found, reported_by, serial_number } = req.query;
    const filter = {};

    if (status) filter.status = parseMultiQuery(status);
    if (category) filter.category = parseMultiQuery(category);
    if (location_found) filter.location_found = parseMultiQuery(location_found);
    if (reported_by) filter.student_name = parseMultiQuery(reported_by);

    const items = await itemRepo.findItems(filter);
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// PATCH /api/items/admin/:id/status — Change item status
router.patch('/admin/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['PUBLISHED', 'UNCLAIMED', 'CLAIMED', 'RETURNED', 'EXPIRED', 'DEACTIVATED', 'DONATED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const item = await itemRepo.updateItem(req.params.id, { status });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    return res.json({ message: 'Status updated.', item });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// POST /api/items/admin/:id/handover-form — Upload physical handover form proof
router.post('/admin/:id/handover-form', authenticateAdmin, upload.single('handover_form'), async (req, res) => {
  try {
    const item = await itemRepo.getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    let formUrl = req.file ? `/uploads/${req.file.filename}` : item.handover_form_url || '';
    let formFilename = req.file ? req.file.filename : item.handover_form_filename || '';
    let handoverAssetId = item.handover_asset_id || null;

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const asset = await assetService.uploadAsset({
          fileBuffer,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          ownerId: req.admin ? req.admin.id : null,
          entityType: 'handover',
          entityId: item.id,
        });
        if (asset && asset.url) {
          formUrl = asset.url;
          handoverAssetId = asset.id;
        }
      } catch (assetErr) {
        console.warn('Supabase Asset upload fallback for handover form:', assetErr.message);
      }
    }

    const updateData = {
      handover_form_url: formUrl,
      handover_form_filename: formFilename,
      handover_asset_id: handoverAssetId,
      handover_date: req.body.handover_date ? new Date(req.body.handover_date) : new Date(),
      status: 'CLAIMED',
      claimed_by_admin: req.admin ? (req.admin.username || req.admin.email || 'Admin') : 'Admin',
    };

    if (req.body.handover_notes !== undefined) updateData.handover_notes = req.body.handover_notes;
    if (req.body.handover_student_name !== undefined) updateData.handover_student_name = req.body.handover_student_name;
    if (req.body.handover_reg_number !== undefined) updateData.handover_reg_number = req.body.handover_reg_number;
    if (req.body.handover_phone !== undefined) updateData.handover_phone = req.body.handover_phone;
    if (req.body.handover_department !== undefined) updateData.handover_department = req.body.handover_department;

    const updatedItem = await itemRepo.updateItem(req.params.id, updateData);
    return res.json({ message: 'Claim form details and physical form saved successfully.', item: updatedItem });
  } catch (err) {
    console.error('Handover form upload error:', err);
    return res.status(500).json({ error: 'Failed to upload physical handover form.' });
  }
});

// GET /api/items/admin/claim-responses — Fetch all claimed item form responses
router.get('/admin/claim-responses', authenticateAdmin, async (req, res) => {
  try {
    const claimedItems = await itemRepo.findItems({
      status: ['CLAIMED']
    });

    return res.json({ responses: claimedItems });
  } catch (err) {
    console.error('Fetch claim responses error:', err);
    return res.status(500).json({ error: 'Failed to fetch claim form responses.' });
  }
});

// PUT /api/items/admin/:id/edit — Full item editing
router.put('/admin/:id/edit', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const item = await itemRepo.getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const updateData = {};
    const fields = ['serial_number', 'uid', 'category', 'who_found', 'location_found', 'date_found', 'time_found', 'description', 'student_name', 'registration_number', 'status', 'handover_notes'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    if (req.file) {
      if (item.image_filename) {
        const oldPath = path.join(__dirname, '..', 'uploads', item.image_filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      let imageUrl = `/uploads/${req.file.filename}`;
      let assetId = item.asset_id || null;

      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const asset = await assetService.uploadAsset({
          fileBuffer,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          ownerId: req.admin ? req.admin.id : null,
          entityType: 'item',
          entityId: item.serial_number || item.id,
        });
        if (asset && asset.url) {
          imageUrl = asset.url;
          assetId = asset.id;
        }
      } catch (assetErr) {
        console.warn('Supabase Asset upload fallback for edit:', assetErr.message);
      }

      updateData.image_url = imageUrl;
      updateData.image_filename = req.file.filename;
      updateData.asset_id = assetId;
    }

    const updatedItem = await itemRepo.updateItem(req.params.id, updateData);
    return res.json({ message: 'Item details updated successfully.', item: updatedItem });
  } catch (err) {
    console.error('SuperAdmin item edit error:', err);
    return res.status(500).json({ error: 'Failed to update item.' });
  }
});

// DELETE /api/items/admin/:id — Delete item + image
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const item = await itemRepo.getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Delete image file from local disk if present
    if (item.image_filename) {
      const imgPath = path.join(__dirname, '..', 'uploads', item.image_filename);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    // Delete Asset records from Supabase Storage & PostgreSQL if present
    if (item.asset_id) {
      try {
        await assetService.deleteAsset(item.asset_id, req.admin, true);
      } catch (assetErr) {
        console.warn('Supabase Asset delete warning:', assetErr.message);
      }
    }

    if (item.handover_asset_id) {
      try {
        await assetService.deleteAsset(item.handover_asset_id, req.admin, true);
      } catch (assetErr) {
        console.warn('Supabase Handover Asset delete warning:', assetErr.message);
      }
    }

    await itemRepo.deleteItem(req.params.id);
    return res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
