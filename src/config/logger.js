const winston = require('winston');
const config = require('./index');

const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]+/g,
  /pit-[a-f0-9-]+/g,
];

const redactSecrets = winston.format((info) => {
  let msg = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
  for (const pattern of SECRET_PATTERNS) {
    msg = msg.replace(pattern, '[REDACTED]');
  }
  info.message = msg;
  return info;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    redactSecrets(),
    winston.format.timestamp(),
    config.nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
