const express = require('express');
const helmet = require('helmet');
const rateLimiter = require('./middleware/rate-limiter');
const errorHandler = require('./middleware/error-handler');
const healthRoutes = require('./routes/health');
const webhookRoutes = require('./routes/webhook');
const aiRoutes = require('./routes/ai');

const app = express();

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
    },
  });
});

app.use('/health', healthRoutes);
app.use('/webhook', webhookRoutes);
app.use('/ai', aiRoutes);

app.use(errorHandler);

module.exports = app;
