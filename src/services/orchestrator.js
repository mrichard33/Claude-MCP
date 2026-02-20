import { generateResponse } from './anthropic.js';
import highlevel from '../integrations/highlevel.js';
import logger from '../config/logger.js';

export async function processWebhook(eventType, payload) {
  logger.info(`Processing webhook event: ${eventType}`);

  const contactId = payload.contactId || payload.id;
  if (!contactId) {
    return { status: 'skipped', reason: 'No contact ID in payload' };
  }

  if (eventType === 'InboundMessage' || eventType === 'ContactCreate' || eventType === 'ContactUpdate') {
    const message =
      payload.body || payload.message || payload.messageBody || `New event: ${eventType}`;
    const leadName = payload.name || payload.contactName || payload.firstName || '';

    const aiResponse = await generateResponse({
      leadName,
      message,
      conversationHistory: [],
      customFields: payload.customFields || {},
    });

    logger.info(`AI response generated for contact ${contactId}`);

    try {
      await highlevel.addNote(contactId, `AI Summary: ${aiResponse.summary || aiResponse.reply}`);
      logger.info(`Note added to contact ${contactId}`);
    } catch (err) {
      logger.warn(`Failed to add note to contact ${contactId}: ${err.message}`);
    }

    return {
      status: 'processed',
      eventType,
      contactId,
      aiResponse,
    };
  }

  logger.info(`Event type ${eventType} received but not handled — passing through`);
  return { status: 'acknowledged', eventType };
}

export async function processDirectRequest({ leadName, message, conversationHistory, customFields }) {
  logger.info('Processing direct AI request');

  const aiResponse = await generateResponse({
    leadName,
    message,
    conversationHistory,
    customFields,
  });

  return { status: 'success', aiResponse };
}
