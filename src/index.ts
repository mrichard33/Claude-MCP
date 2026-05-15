#!/usr/bin/env node
import express, { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { validateAuth } from './auth.js';
import { listFilesTool } from './tools/listFiles.js';
import { getFileTool } from './tools/getFile.js';
import { createOrUpdateFileTool } from './tools/createOrUpdateFile.js';
import { createBranchTool } from './tools/createBranch.js';
import { searchCodeTool } from './tools/searchCode.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const INSTANCE_ID = randomUUID();

type ToolDef = {
  name: string;
  description: string;
  inputSchema: { shape: Record<string, unknown> };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'dashboard-mcp',
    version: '1.0.0',
  });

  const tools: ToolDef[] = [
    listFilesTool as unknown as ToolDef,
    getFileTool as unknown as ToolDef,
    createOrUpdateFileTool as unknown as ToolDef,
    createBranchTool as unknown as ToolDef,
    searchCodeTool as unknown as ToolDef,
  ];

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.shape as Parameters<typeof server.tool>[2],
      async (args: Record<string, unknown>) => {
        try {
          const result = await tool.handler(args);
          return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }
  return server;
}

const transports = new Map<string, StreamableHTTPServerTransport>();

async function createAndRegisterSession(): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  transport.onclose = () => {
    if (transport.sessionId) transports.delete(transport.sessionId);
  };
  const server = createMcpServer();
  await server.connect(transport);
  return transport;
}

const app = express();
app.set('trust proxy', 1);

app.get(['/', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'dashboard-mcp',
    version: '1.0.0',
    instance_id: INSTANCE_ID,
    github_configured: !!(process.env.GITHUB_PAT && process.env.GITHUB_OWNER && process.env.GITHUB_REPO),
  });
});

const mcpRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

const mcpHandler = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.close();
        transports.delete(sessionId);
      }
      res.status(200).end();
      return;
    }

    if (req.method === 'POST') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res);
        return;
      }
      if (sessionId) {
        console.log(`[MCP] Unknown session ${sessionId.slice(0, 8)}… — returning 404 for client re-init`);
        res.status(404).json({ error: 'Session not found — please re-initialize' });
        return;
      }
      const transport = await createAndRegisterSession();
      await transport.handleRequest(req, res);
      if (transport.sessionId) transports.set(transport.sessionId, transport);
      return;
    }

    if (req.method === 'GET') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res);
        return;
      }
      res.status(400).json({ error: 'Missing or invalid session ID' });
      return;
    }

    res.status(405).end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MCP] handler error:', message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

app.all('/mcp', mcpRateLimit, validateAuth, mcpHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`dashboard-mcp listening on port ${PORT}`);
  console.log(`  Instance:  ${INSTANCE_ID}`);
  console.log(`  Health:    http://0.0.0.0:${PORT}/health`);
  console.log(`  MCP:       http://0.0.0.0:${PORT}/mcp`);
  console.log(`  Auth:      ${process.env.MCP_AUTH_TOKEN ? 'configured' : 'NOT CONFIGURED — set MCP_AUTH_TOKEN'}`);
});
