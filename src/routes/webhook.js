import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import verifyWebhookSignature from '../middleware/webhook-auth.js';
import { processWebhook } from '../services/orchestrator.js';
import logger from '../config/logger.js';

const router = Router();

router.post(
  '/highlevel',
  verifyWebhookSignature,
  body('type').notEmpty().withMessage('Event type is required').trim().escape(),
  body('payload').notEmpty().withMessage('Payload is required'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'BAD_REQUEST', details: errors.array() },
      });
    }

    try {
      const { type, payload } = req.body;
      const result = await processWebhook(type, payload);
      res.json(result);
    } catch (err) {
      logger.error(`Webhook processing error: ${err.message}`);
      next(err);
    }
  }
);

export default router;
