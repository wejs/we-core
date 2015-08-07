var winston = require('winston');
var path = require('path');
var _ = require('lodash');
var events = require('../events');

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
      new (winston.transports.Console)(configs.log),
      new (winston.transports.File)(configs.log)
    ]
  });
};

events.on('we:after:load:socket.io', function (data) {
  if (data.we.config.liveLogger) {
    data.we.log.stream({ start: -1 }).on('log', function(log) {
      data.we.io.sockets.in('logger').emit('logger:live', log);
    });
    // TODO add acl check
    data.we.io.on('connection', function (socket) {
      socket.join('logger');
    })
  }
});
