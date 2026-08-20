const { ValidationError } = require('../errors/AppErrors');

const validateUploadUrlRequest = (req, res, next) => {
  const { originalFilename, mimeType } = req.body || {};

  if (!originalFilename || typeof originalFilename !== 'string' || !originalFilename.trim()) {
    return next(new ValidationError('Field originalFilename is required and must be a valid non-empty string.'));
  }

  if (!mimeType || typeof mimeType !== 'string' || !mimeType.trim()) {
    return next(new ValidationError('Field mimeType is required and must be a valid non-empty string.'));
  }

  next();
};

const validateListAssetsQuery = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new ValidationError('Query parameter page must be a positive integer >= 1.'));
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new ValidationError('Query parameter limit must be an integer between 1 and 100.'));
    }
  }

  next();
};

module.exports = {
  validateUploadUrlRequest,
  validateListAssetsQuery,
};
