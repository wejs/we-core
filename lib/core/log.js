var winston = require('winston');

module.exports = function getTheLogger(we) {
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
  // try to load database configs from project database config
  try {
    cfgFile = require( path.resolve( we.projectPath, 'configs', 'log.js' ));
    _.merge(configs, cfgFile);
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load log config:', e);  
    }
  }

  return logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(configs.log)
    ]
  });
};
