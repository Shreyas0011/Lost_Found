const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'fnx7rx25',
  api_key: process.env.CLOUDINARY_API_KEY || '889179851313114',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dHZIHK_xNt_v05xj61rrbzBCw9Y',
  secure: true,
});

/**
 * Uploads a file (by local filepath or buffer) to Cloudinary.
 * @param {string} filePath Local path of uploaded file
 * @param {string} folder Optional Cloudinary folder (defaults to 'lost_and_found_items')
 * @returns {Promise<{ url: string, public_id: string, secure_url: string }>}
 */
async function uploadToCloudinary(filePath, folder = 'lost_and_found_items') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    // Cleanup local temp file if it exists
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    return {
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
    };
  } catch (err) {
    console.error('Cloudinary Upload Error:', err.message);
    throw err;
  }
}

/**
 * Deletes an asset from Cloudinary by public_id
 * @param {string} publicId
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Cloudinary Destroy Error:', err.message);
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
