import config from './config/index.js';
import logger from './config/logger.js';
import app from './app.js';

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Middleware service running on 0.0.0.0:${config.port} (${config.nodeEnv})`);
  logger.info('Endpoints: GET /, GET /health, POST /webhook/highlevel, POST /ai/respond, POST /mcp');
});
