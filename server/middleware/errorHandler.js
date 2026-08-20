const { AppError } = require('../errors/AppErrors');

/**
 * Centralized Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  } else {
    // Log unexpected errors internally
    console.error('Unhandled Error:', err);
    if (process.env.NODE_ENV !== 'production') {
      details = err.stack;
    }
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
};

module.exports = errorHandler;
