const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const orchestrator = require('../services/orchestrator');
const logger = require('../config/logger');

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
      const result = await orchestrator.processDirectRequest({
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

module.exports = router;
