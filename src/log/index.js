const winston = require('winston'),
  _ = require('lodash');

module.exports = function getTheLogger(we) {
  if (!we) throw new Error('we instance is required for get logger instance');
  const env = we.env;
  const log = we.config.log;
  const defaultAll = {
    level: 'info',
    colorize: false,
    timestamp: true,
    json: true,
    stringify: true,
    prettyPrint: true,
    depth: 5,
    showLevel: false
  }
  const oldConfig = (log, defaultAll) => _.defaults(log, defaultAll)
  const newConfig = (log, defaultAll, env) => {
    if (env === 'prod') return _.defaults(log.prod, defaultAll)
    else if (env === 'dev') return _.defaults(log.dev, defaultAll)
    else return _.defaults(log.test, defaultAll)
  }
  
  const configs = log.dev === undefined ? 
                  oldConfig(log, defaultAll) :
                  newConfig(log, defaultAll, env)
  
  // allow to set log level with LOG_LV enviroment variable
  if (process.env.LOG_LV) configs.level = process.env.LOG_LV;

  // start one logger
  const logger = new(winston.Logger)(configs);

  if (!configs.transports || !configs.transports.length) {
    // default console logger
    logger.add(winston.transports.Console, configs);
  }
  // save close method
  logger.closeAllLoggersAndDisconnect = closeAllLoggersAndDisconnect;

  return logger;
};

/**
 * Method for wait all log writes after disconnect
 *
 * @param  {Object}   we
 * @param  {Function} cb
 */
function closeAllLoggersAndDisconnect(we, cb) {
  setTimeout(() => {
    cb();
  }, 350);
}