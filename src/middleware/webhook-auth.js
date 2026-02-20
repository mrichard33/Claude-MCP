import crypto from 'node:crypto';
import config from '../config/index.js';
import logger from '../config/logger.js';

function verifyWebhookSignature(req, res, next) {
  if (!config.ghl.webhookSecret) {
    return next();
  }

  const signature = req.headers['x-ghl-signature'] || req.headers['x-highlevel-signature'];

  if (!signature) {
    logger.warn('Webhook received without signature header');
    return res.status(401).json({
      error: { message: 'Missing webhook signature', code: 'UNAUTHORIZED' },
    });
  }

  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', config.ghl.webhookSecret)
    .update(body)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!isValid) {
    logger.warn('Webhook signature verification failed');
    return res.status(401).json({
      error: { message: 'Invalid webhook signature', code: 'UNAUTHORIZED' },
    });
  }

  next();
}

export default verifyWebhookSignature;
