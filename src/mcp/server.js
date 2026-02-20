import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import highlevel from '../integrations/highlevel.js';
import logger from '../config/logger.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'highlevel-crm',
    version: '1.0.0',
  });

  server.tool(
    'get_contact',
    'Retrieve a contact\'s details from HighLevel CRM by their contact ID.',
    { contactId: z.string().describe('The HighLevel contact ID') },
    async ({ contactId }) => {
      logger.info(`MCP tool: get_contact(${contactId})`);
      try {
        const contact = await highlevel.getContact(contactId);
        return {
          content: [{ type: 'text', text: JSON.stringify(contact, null, 2) }],
        };
      } catch (err) {
        logger.error(`get_contact failed: ${err.message}`);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'update_contact',
    'Update fields on a contact in HighLevel CRM. Pass the contact ID and an object of fields to update (e.g., firstName, lastName, email, phone, tags).',
    {
      contactId: z.string().describe('The HighLevel contact ID'),
      data: z.record(z.string(), z.unknown()).describe('Object of fields to update on the contact'),
    },
    async ({ contactId, data }) => {
      logger.info(`MCP tool: update_contact(${contactId})`);
      try {
        const result = await highlevel.updateContact(contactId, data);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        logger.error(`update_contact failed: ${err.message}`);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'send_message',
    'Send a message to a contact through HighLevel CRM conversations.',
    {
      contactId: z.string().describe('The HighLevel contact ID'),
      message: z.string().describe('The message text to send to the contact'),
    },
    async ({ contactId, message }) => {
      logger.info(`MCP tool: send_message(${contactId})`);
      try {
        const result = await highlevel.sendMessage(contactId, message);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        logger.error(`send_message failed: ${err.message}`);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'add_note',
    'Add an internal note to a contact in HighLevel CRM. Useful for logging summaries, follow-up reminders, or context.',
    {
      contactId: z.string().describe('The HighLevel contact ID'),
      note: z.string().describe('The note text to add'),
    },
    async ({ contactId, note }) => {
      logger.info(`MCP tool: add_note(${contactId})`);
      try {
        const result = await highlevel.addNote(contactId, note);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        logger.error(`add_note failed: ${err.message}`);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_conversations',
    'Retrieve the conversation history for a contact from HighLevel CRM.',
    { contactId: z.string().describe('The HighLevel contact ID') },
    async ({ contactId }) => {
      logger.info(`MCP tool: get_conversations(${contactId})`);
      try {
        const conversations = await highlevel.getConversations(contactId);
        return {
          content: [{ type: 'text', text: JSON.stringify(conversations, null, 2) }],
        };
      } catch (err) {
        logger.error(`get_conversations failed: ${err.message}`);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}
