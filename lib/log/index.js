var winston = require('winston');
var path = require('path');
var _ = require('lodash');

var logger = null;

module.exports = function getTheLogger(projectPath) {
  if (!projectPath) projectPath = process.cwd();
  // cache
  if (logger) return logger;

  var cfgFile = {};
  var configs = {
    log: {
      level: 'debug' ,
      colorize: true,
      timestamp: true,
      prettyPrint: true,
      depth: 5,
      showLevel: true
    }
  }

  try {
    cfgFile = require( path.resolve( projectPath, 'config', 'log.js' ));
    _.merge(configs, cfgFile);
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load log config:', e);
    }
  }

  if (process.env.LOG_LV) configs.log.level = process.env.LOG_LV;

  return logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(configs.log)
    ]
  });
};
