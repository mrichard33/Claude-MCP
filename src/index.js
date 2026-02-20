const config = require('./config');
const logger = require('./config/logger');
const app = require('./app');

app.listen(config.port, () => {
  logger.info(`Middleware service running on port ${config.port} (${config.nodeEnv})`);
  logger.info('Endpoints: GET /health, POST /webhook/highlevel, POST /ai/respond');
});
