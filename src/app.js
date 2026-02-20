import express from 'express';
import helmet from 'helmet';
import rateLimiter from './middleware/rate-limiter.js';
import errorHandler from './middleware/error-handler.js';
import healthRoutes from './routes/health.js';
import webhookRoutes from './routes/webhook.js';
import aiRoutes from './routes/ai.js';
import mcpHandler from './mcp/handler.js';

const app = express();

// MCP endpoint — mounted before helmet/rate limiter so they don't interfere
app.use('/mcp', express.json(), mcpHandler);

app.use(helmet());
app.use(express.json());
app.use(rateLimiter);

app.get('/', (req, res) => {
  res.json({
    service: 'HighLevel-Anthropic Middleware',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /webhook/highlevel',
      ai: 'POST /ai/respond',
      mcp: 'POST /mcp (MCP Streamable HTTP)',
    },
  });
});

app.use('/health', healthRoutes);
app.use('/webhook', webhookRoutes);
app.use('/ai', aiRoutes);

app.use(errorHandler);

export default app;
