var winston = require('winston');
var path = require('path');
var _ = require('lodash');

module.exports = function getTheLogger(we) {
  if (!we) throw new Error('we instance is required for get logger instance');

  var logger = null;

  var cfgFile = {};
  var configs = {
    log: {
      level: 'info' ,
      colorize: true,
      timestamp: true,
      prettyPrint: true,
      depth: 5,
      showLevel: true
    }
  }

  try {
    cfgFile = require( path.resolve( we.projectPath, 'config', 'log.js' ));
    _.merge(configs, cfgFile);
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      throw e;
    }
  }

  if (process.env.LOG_LV) configs.log.level = process.env.LOG_LV;

  return logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(configs.log)
    ]
  });
};