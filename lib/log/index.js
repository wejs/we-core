'use strict';

var winston = require('winston');
var _ = require('lodash');

module.exports = function getTheLogger(we) {
  if (!we) throw new Error('we instance is required for get logger instance');
  var configs = _.defaults(we.config.log, {
    level: 'info',
    colorize: false,
    timestamp: true,
    json: true,
    stringify: true,
    prettyPrint: true,
    depth: 5,
    showLevel: false
  });

  // allow to set log level with LOG_LV enviroment variable
  if (process.env.LOG_LV) configs.level = process.env.LOG_LV;

  // start one logger
  var logger = new winston.Logger(configs);

  if (!configs.transports || !configs.transports.length) {
    // default console logger
    logger.add(winston.transports.Console, configs);
  }
  // sabe close method
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
  setTimeout(function () {
    cb();
  }, 350);
}