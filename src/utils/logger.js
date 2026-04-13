const LOG_LEVEL = { debug:0, info:1, warn:2, error:3 };
const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 1 : 0;

const log = (severity, message, data = {}) => {
  if (LOG_LEVEL[severity] < MIN_LEVEL) return;
  const entry = {
    severity: severity.toUpperCase(),
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
  // Cloud Logging picks up structured JSON written to stdout
  process.stdout.write(JSON.stringify(entry) + '\n');
};

const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info:  (msg, data) => log('info',  msg, data),
  warn:  (msg, data) => log('warn',  msg, data),
  error: (msg, data) => log('error', msg, data),
};

module.exports = logger;