const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/assetController');
const upload = require('../middleware/assetUploadMiddleware');
const { authenticateAny } = require('../middleware/auth');
const {
  validateUploadUrlRequest,
  validateListAssetsQuery,
} = require('../validators/assetValidator');

const assetController = new AssetController();

// POST /api/assets - Upload file asset directly to server
router.post(
  '/',
  authenticateAny,
  upload.single('file'),
  assetController.uploadAsset
);

// POST /api/assets/upload-url - Generate pre-signed upload URL for direct client upload
router.post(
  '/upload-url',
  authenticateAny,
  validateUploadUrlRequest,
  assetController.generateUploadUrl
);

// POST /api/assets/:id/complete - Complete direct client upload
router.post(
  '/:id/complete',
  authenticateAny,
  assetController.completeDirectUpload
);

// GET /api/assets - List assets with pagination & filtering
router.get(
  '/',
  authenticateAny,
  validateListAssetsQuery,
  assetController.listAssets
);

// GET /api/assets/:id - Get asset metadata & access URLs
router.get(
  '/:id',
  authenticateAny,
  assetController.getAssetById
);

// DELETE /api/assets/:id - Delete asset
router.delete(
  '/:id',
  authenticateAny,
  assetController.deleteAsset
);

module.exports = router;
