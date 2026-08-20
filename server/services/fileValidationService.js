const path = require('path');
const { ValidationError } = require('../errors/AppErrors');
const config = require('../config/supabase');

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
};

const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/webp', check: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' },
];

class FileValidationService {
  /**
   * Validate file buffer, filename, MIME type, and size
   */
  validateFile(fileBuffer, originalFilename, declaredMimeType, sizeBytes) {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new ValidationError('File content is empty or invalid.');
    }

    const actualSize = sizeBytes || fileBuffer.length;
    if (actualSize > config.maxFileSize) {
      const maxMb = (config.maxFileSize / (1024 * 1024)).toFixed(1);
      throw new ValidationError(`File size exceeds maximum allowed limit of ${maxMb}MB.`);
    }

    const ext = path.extname(originalFilename || '').toLowerCase();
    if (!ext) {
      throw new ValidationError('File extension missing in original filename.');
    }

    const normalizedMime = (declaredMimeType || '').toLowerCase();
    const validExtensions = ALLOWED_MIME_TYPES[normalizedMime];

    if (!validExtensions) {
      throw new ValidationError(`MIME type '${declaredMimeType}' is not supported.`);
    }

    if (!validExtensions.includes(ext)) {
      throw new ValidationError(`File extension '${ext}' does not match declared MIME type '${declaredMimeType}'.`);
    }

    // Verify magic bytes / file signature to prevent extension spoofing
    this.verifyMagicBytes(fileBuffer, normalizedMime);

    return {
      isValid: true,
      extension: ext,
      mimeType: normalizedMime,
      sizeBytes: actualSize,
    };
  }

  /**
   * Verify header bytes of file buffer match expected MIME signature
   */
  verifyMagicBytes(buffer, mimeType) {
    const magic = MAGIC_BYTES.find((m) => m.mime === mimeType);
    if (!magic) return true; // Skip if no magic bytes rule defined for this MIME

    if (magic.check) {
      if (!magic.check(buffer)) {
        throw new ValidationError(`File signature verification failed for '${mimeType}'. File content is corrupted or spoofed.`);
      }
      return true;
    }

    if (buffer.length < magic.bytes.length) {
      throw new ValidationError('File content is too small or invalid.');
    }

    for (let i = 0; i < magic.bytes.length; i++) {
      if (buffer[i] !== magic.bytes[i]) {
        throw new ValidationError(`File header magic bytes do not match expected signature for '${mimeType}'. Extension spoofing detected.`);
      }
    }

    return true;
  }
}

module.exports = new FileValidationService();
