import logger from '../config/logger.js';

function errorHandler(err, req, res, _next) {
  logger.error(`${err.name || 'Error'}: ${err.message}`);

  if (err.status === 429 || err.type === 'rate_limit_error') {
    return res.status(429).json({
      error: { message: 'Rate limit exceeded. Please retry later.', code: 'RATE_LIMIT' },
    });
  }

  if (err.name === 'APIError' || err.type === 'authentication_error') {
    return res.status(502).json({
      error: { message: 'Upstream API error', code: 'UPSTREAM_ERROR' },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { message: 'Invalid JSON in request body', code: 'BAD_REQUEST' },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  });
}

export default errorHandler;
