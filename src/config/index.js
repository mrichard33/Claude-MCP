const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const required = ['ANTHROPIC_API_KEY'];
const optional = ['GHL_API_KEY', 'GHL_LOCATION_ID'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

for (const key of optional) {
  if (!process.env[key]) {
    console.warn(`Warning: environment variable ${key} is not set — GHL integration will not work`);
  }
}

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  ghl: {
    apiKey: process.env.GHL_API_KEY,
    locationId: process.env.GHL_LOCATION_ID,
    webhookSecret: process.env.GHL_WEBHOOK_SECRET || null,
    baseUrl: 'https://services.leadconnectorhq.com',
    apiVersion: '2021-07-28',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-opus-4-20250514',
    maxTokens: 1024,
    timeoutMs: 30000,
  },
});

module.exports = config;
