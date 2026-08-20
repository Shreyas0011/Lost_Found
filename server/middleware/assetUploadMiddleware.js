const multer = require('multer');
const config = require('../config/supabase');

// Memory storage keeps file buffer in memory for validation & Supabase upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
  },
});

module.exports = upload;
