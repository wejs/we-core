const winston = require('winston'),
  _ = require('lodash');

const { createLogger, transports, format } = require('winston');
const Transport = require('winston-transport');
const logform = require('logform');
const { combine, timestamp, json, label, printf } = logform.format;


module.exports = function getTheLogger(we) {
  if (!we) throw new Error('we instance is required for get logger instance');

  const env = we.env,
    log = we.config.log,
    defaultAll = {
      level: 'info',
      colorize: true,
      timestamp: true,
      json: false,
      stringify: false,
      prettyPrint: true,
      depth: 5,
      showLevel: true
    };

  let configs;
  // if have an specific configuration for this env:
  if (log !== undefined && log[env]) {
    // Add support to set multiple log configs for diferent envs in same configuration:
    configs = _.defaults(log[env], defaultAll);
  } else if (log) {
    // log config without env log:
    configs = _.defaults(log, defaultAll);
  } else {
    // if configs not is set use the default:
    configs = defaultAll;
  }

  // allows to set log level with LOG_LV enviroment variable
  if (process.env.LOG_LV) configs.level = process.env.LOG_LV;

  let format;

  if (configs.format) {
    format = configs.format;
  } else {
    format = combine(
      label({label: 'wejs-app'}),
      json(),
      timestamp()
    );
  }

  // start one logger
  const logger = createLogger({
    level: configs.level,
    format: format,
    transports: configs.transports
  });

  if (configs.keepConsoleTransport || !configs.transports || !configs.transports.length) {
    // default console logger
    logger.add(new transports.Console(configs));
  }
  // save close method
  logger.closeAllLoggersAndDisconnect = closeAllLoggersAndDisconnect;

  return logger;
};

/**
 * Method for wait all log writes before disconnect
 *
 * @param  {Object}   we
 * @param  {Function} cb
 */
function closeAllLoggersAndDisconnect(we, cb) {
  setTimeout(() => {
    cb();
  }, 350);
}