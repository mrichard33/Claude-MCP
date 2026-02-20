import Anthropic from '@anthropic-ai/sdk';
import config from '../config/index.js';
import logger from '../config/logger.js';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_PROMPT = `You are an AI assistant integrated into a CRM system. Your role is to help manage customer interactions by:
- Generating professional, helpful responses to customer inquiries
- Summarizing conversations concisely
- Suggesting follow-up actions for the sales/support team

Always respond in structured JSON with the following fields:
- "reply": The message to send back to the customer
- "summary": A brief internal summary of the interaction
- "suggestedActions": An array of recommended next steps for the team

Keep responses professional, concise, and actionable.`;

export async function generateResponse({ leadName, message, conversationHistory = [], customFields = {} }) {
  const messages = [];

  for (const entry of conversationHistory) {
    messages.push({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: entry.content,
    });
  }

  let userContent = message;
  if (leadName) {
    userContent = `[Lead: ${leadName}] ${message}`;
  }
  if (Object.keys(customFields).length > 0) {
    userContent += `\n[Custom Fields: ${JSON.stringify(customFields)}]`;
  }

  messages.push({ role: 'user', content: userContent });

  logger.info(`Sending request to Anthropic (model: ${config.anthropic.model})`);

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    try {
      const response = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: config.anthropic.maxTokens,
        system: SYSTEM_PROMPT,
        messages,
      });

      const text = response.content[0].text;

      try {
        return JSON.parse(text);
      } catch {
        return { reply: text, summary: '', suggestedActions: [] };
      }
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        logger.error(`Anthropic API failed after ${maxAttempts} attempts: ${err.message}`);
        throw err;
      }
      logger.warn(`Anthropic API attempt ${attempt} failed, retrying: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}
