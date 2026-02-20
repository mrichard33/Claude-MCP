const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const verifyWebhookSignature = require('../middleware/webhook-auth');
const orchestrator = require('../services/orchestrator');
const logger = require('../config/logger');

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
      const result = await orchestrator.processWebhook(type, payload);
      res.json(result);
    } catch (err) {
      logger.error(`Webhook processing error: ${err.message}`);
      next(err);
    }
  }
);

module.exports = router;
