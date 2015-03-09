#!/usr/bin/env node

/**
 * Module dependencies.
 */

var debug = require('debug')('we.js:server');
var async = require('async');
var express = require('express');
var http = require('http');
var _ = require('lodash');
var path = require('path');
var wePassport = require('./passport/index.js');
var pluginManager = require('./pluginManager');
var mkdirp = require('mkdirp');

var we = {};

we.hooks = require('./hooks');
we.events = require('./events');

// project path
we.projectPath = process.cwd();

// - Configure Logger 
we.log = require('./log')(we.projectPath);

we.acl = require('./acl');

// start and load db
we.db = require('./database/index.js');

we.loaders = require('./loaders.js');
we.router = require('./router.js');
we.config = require('./staticConfig')(we.projectPath);

we.pluginPaths = [];
we.pluginNames = [];
// load plugin configs
we.pluginConfigs = require('./pluginManager/loadPluginConfig.js')();
we.plugins = pluginManager.plugins;

// save plugin paths and names in a array
for ( var pluginName in we.plugins ) {
  we.pluginNames.push(pluginName); 
  if (we.plugins[pluginName].pluginPath) {
    we.pluginPaths.push(we.plugins[pluginName].pluginPath);
  } 
}

if (we.env != 'prod') {
  var pluginNames = Object.keys(we.plugins);
  we.log.info( pluginNames.length +' plugins loaded:', pluginNames.join() )
}

we.childProcesses = [];

we.db.models = {};
we.db.modelsConfigs = {};

we.controllers = {};
weExpress = require('./express');
// we.js classes
we.class = require('./class/index.js');
// save a reference to we.js object
we.class.Plugin.prototype.we = we;

// enviroment config prod | dev | test
we.env = require('./env.js');

we.getRouter = function() {
  return express.Router();
}

// - Default vars
 
// load package.json file
var projectPackageJSON = require( path.resolve( we.projectPath, 'package.json') );

/**
 * Bootstrap and initialize the app
 * 
 */
we.bootstrap = function bootstrap(configOnRun, cb) {  
  var dbConfigs = {};

  if (!cb) {
    cb = configOnRun;
    configOnRun = null;
  }

  if (configOnRun) _.merge(we.config, configOnRun);

  async.series([
    function loadPluginFeatures(next) {
      var pluginNames = Object.keys(we.plugins);
      for (var pluginName in we.plugins) {
        // run all plugins loadFeatures function
        we.plugins[pluginName].loadFeatures();
      }
      next();
    },

    function loadModels(next) {
      we.loaders.loadModels(we, function(err, models) {
        if (err) return next(err);
        _.merge(we.db.modelsConfigs, models);
        next();
      })
    },

    function instantiateModels(next) {
      we.hooks.trigger('we:models:after:instance', we, function(err) {
        for ( var modelName in we.db.modelsConfigs) {
          we.db.models[modelName] = we.db.define(
            modelName, 
            we.db.modelsConfigs[modelName].definition, 
            we.db.modelsConfigs[modelName].options
          );
        }

        we.hooks.trigger('we:models:set:joins', we, function afterSetJoins(err) {  
          we.db.syncAllModels(next);
        });
      });
    },
    function loadControllers(next) {
      // load default controller
      we.defaultController = require('./controllers/defaultController.js');

      we.loaders.loadControllers(we, function(err, controllers) {
        if (err) return next(err);
        _.merge(we.controllers, controllers);
        next();
      })
    },

    function initExpressPassport(next) {
      we.express = weExpress(we);
      // - Passports configs
      wePassport.configureAndSetStrategies(we);
      next();
    },

    function createDefaultFolders(next) {
      we.events.emit('we:create:default:folders', we);

      next();
    },

    function startGrunt(next) {
      if (we.env === 'dev') {
        runTask = require('./grunt/initTaskAsSubProcess.js');
        runTask('default', we);
      }
      next();
    },

    function mergeRoutes(next) {
      we.routes = {};
      // merge plugin routes
      for ( var plugin in we.plugins) {
        _.merge(we.routes, we.plugins[plugin].routes);
      }
      // merge project routes
       _.merge(we.routes, we.config.routes);
      next();
    },

    function bindRoutes(next) {
      for( var route in we.routes) {
        we.router.bindRoute(we, route, we.routes[route] );
      }
      next();
    },

    function bindShadownRoutes(next) {
      we.router.bindShadownRoutes(we, next);
    }
  ], function bootstrapDone(err) {
    if (err) throw new Error(err);

    we.events.emit('we:bootstrap:done', we);

    we.log.info('We.js bootstrap done');
    return cb(null, we);
  });
}

we.startServer = function startExpressServer(cb) {
  /**
   * Get port from environment and store in Express.
   */

  var port = normalizePort(we.config.port);
  we.express.set('port', port);

  /**
   * Create HTTP server.
   */

  var server = http.createServer(we.express);

  /**
   * Listen on provided port, on all network interfaces.
   */

  // catch 404 and forward to error handler
  we.express.use(function(req, res, next) {
    we.log.debug('Route not found:', req.path);
    // var err = new Error('Not Found');
    // err.status = 404;
    return res.notFound();
  });

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  /**
   * Normalize a port into a number, string, or false.
   */

  function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

  // save the current server 
  we.http = server;

  cb(null, we);
}

/**
 * Bootstrap and Start we.js server 
 * 
 * @param  {Object}   cfgs configs (optional)
 * @param  {Function} cb   callback
 */
we.go = function go(cfgs, cb) {
  if (!cb) {
    cb = cfgs;
    cfgs = {};
  }

  we.bootstrap(cfgs, function(err, we) {
    we.startServer(cb);
  });
}

module.exports = we;
