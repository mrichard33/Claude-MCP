const config = require('./config');
const logger = require('./config/logger');
const app = require('./app');

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Middleware service running on 0.0.0.0:${config.port} (${config.nodeEnv})`);
  logger.info('Endpoints: GET /, GET /health, POST /webhook/highlevel, POST /ai/respond');
});
