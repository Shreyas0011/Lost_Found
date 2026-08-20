class ImageProcessingService {
  /**
   * Extracts basic image dimensions (width, height) from buffer headers
   */
  extractMetadata(buffer, mimeType) {
    if (!mimeType.startsWith('image/')) {
      return { width: null, height: null, isImage: false };
    }

    try {
      let width = null;
      let height = null;

      if (mimeType === 'image/png' && buffer.length >= 24) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      } else if (mimeType === 'image/gif' && buffer.length >= 10) {
        width = buffer.readUInt16LE(6);
        height = buffer.readUInt16LE(8);
      } else if (mimeType === 'image/jpeg') {
        let offset = 2;
        while (offset < buffer.length) {
          const marker = buffer.readUInt16BE(offset);
          if (marker >= 0xffc0 && marker <= 0xffc3) {
            height = buffer.readUInt16BE(offset + 5);
            width = buffer.readUInt16BE(offset + 7);
            break;
          }
          offset += 2 + buffer.readUInt16BE(offset + 2);
        }
      }

      return {
        width: width && width < 100000 ? width : null,
        height: height && height < 100000 ? height : null,
        isImage: true,
      };
    } catch (err) {
      return { width: null, height: null, isImage: true };
    }
  }

  /**
   * Hook for WebP or thumbnail processing pipeline
   */
  async processImage(buffer, mimeType, options = {}) {
    // Returns original buffer & extracted metadata; hook ready for sharp / thumbnail extension
    const metadata = this.extractMetadata(buffer, mimeType);
    return {
      processedBuffer: buffer,
      contentType: mimeType,
      width: metadata.width,
      height: metadata.height,
    };
  }
}

module.exports = new ImageProcessingService();
