import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import config from '../config/index.js';
import logger from '../config/logger.js';

const router = Router();

function mcpAuth(req, res, next) {
  if (!config.mcp.authToken) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Missing or invalid Authorization header' },
      id: null,
    });
  }

  const token = authHeader.slice(7);
  if (token !== config.mcp.authToken) {
    return res.status(403).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Invalid authentication token' },
      id: null,
    });
  }

  next();
}

router.post('/', mcpAuth, async (req, res) => {
  logger.info('MCP request received');

  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error(`MCP handler error: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

router.get('/', mcpAuth, (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32601, message: 'Method not allowed. Use POST for stateless MCP.' },
    id: null,
  });
});

router.delete('/', mcpAuth, (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32601, message: 'Method not allowed. Stateless server has no sessions.' },
    id: null,
  });
});

export default router;
