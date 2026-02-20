import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { processDirectRequest } from '../services/orchestrator.js';
import logger from '../config/logger.js';

const router = Router();

router.post(
  '/respond',
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('leadName').optional().trim().escape(),
  body('conversationHistory').optional().isArray(),
  body('customFields').optional().isObject(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: 'Validation failed', code: 'BAD_REQUEST', details: errors.array() },
      });
    }

    try {
      const { message, leadName, conversationHistory, customFields } = req.body;
      const result = await processDirectRequest({
        leadName,
        message,
        conversationHistory,
        customFields,
      });
      res.json(result);
    } catch (err) {
      logger.error(`AI respond error: ${err.message}`);
      next(err);
    }
  }
);

export default router;
