/**
 * 日志存储
 */
const log4js = require('log4js');

const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
};

log4js.configure({
  // 附加器
  appenders: {
    // 打印
    console: { type: 'console' },
    info: {
      // 输出
      type: 'file',
      filename: 'logs/all-logs.log',
    },
    error: {
      // 输出
      type: 'dateFile',
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true, // filename + pattern
    },
  },
  // log的类别
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    info: {
      appenders: ['info', 'console'],
      level: 'info',
    },
    error: {
      appenders: ['error', 'console'],
      level: 'error',
    },
  },
});

// trace > debug > info > warn > error > fatal

/**
 * 日志输出，level 为 debug
 * @param {string} content
 */
exports.debug = (content) => {
  // 不传参，默认 default
  const logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
};

/**
 * 日志输出，level 为 info
 * @param {string} content
 */
exports.info = (content) => {
  const logger = log4js.getLogger('info');
  logger.level = levels.info;
  logger.info(content);
};

/**
 * 日志输出，level 为 error
 * @param {string} content
 */
exports.error = (content) => {
  const logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content);
};
