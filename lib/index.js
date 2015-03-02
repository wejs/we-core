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
var wePassport = require('./core/passport/index.js');
var themeEngine= require('./core/theme/index.js');

var wejsSequelize = require('./core/database/sequelize.js');
var we = {};

we.loaders = require('./core/loaders.js');
we.router = require('./core/router.js');
we.configs = {};
we.plugins = {};
we.pluginPaths = [];

we.models = {};
we.modelsConfigs = {};
we.Sequelize = require('sequelize');

we.controllers = {};
weExpress = require('./core/express');
// we.js classes
we.class = require('./core/class/index.js');
// save a reference to we.js object
we.class.Plugin.prototype.we = we;

we.env = we.loaders.enviroment(we);

we.getRouter = function() {
  return express.Router();
}

// - utils and helper functions
we.utils = require('./core/utils.js');

// - Default vars
 
// project path
we.projectPath = process.cwd();

// load package.json file
var projectPackageJSON = require( path.resolve( we.projectPath, 'package.json') );

// - Configure Logger 
we.log = require('./core/log.js')(we);

/**
 * Bootstrap and initialize the app
 * 
 * @return {[type]} [description]
 */
we.bootstrap = function bootstrap(cb) {  
  var dbConfigs = {};

  async.series([
    function startAndLoadDB(next) {
      // start and set database connection
      we.db = wejsSequelize.connect(we);
      // load core models
      wejsSequelize.loadCoreModels(we, function(err) {
        if (err) return next(err);
        return next();
      });      
    }, 
    function parseAndLoadConfigs(next) {
      we.models.sys_configuration.findAll()
      .done(function(err, results){
        if (err) return next(err);
        
        // TODO parse db configs ...
        we.log.debug('Configs found in db:',results);

        next();
      });
    
    },

    function registerPlugins(next) {
      // load plugin configs
      we.pluginConfigs = we.loaders.loadPluginConfig(we);

      we.loaders.registerPlugins(we, function(err, plugins) {
        if (err) return next(err);
        _.merge(we.plugins, plugins);
        // save plugin paths in a array
        for ( var pluginName in we.plugins ) {
          if (we.plugins[pluginName].pluginPath) {
            we.pluginPaths.push(we.plugins[pluginName].pluginPath);
          } 
        }

        if (we.env != 'prod') {
          var pluginNames = Object.keys(we.plugins);
          we.log.info( pluginNames.length +' plugins loaded:', pluginNames.join() )
        }

        next();
      })
    }, 
    function loadStaticConfigs(done) {
      we.loaders.loadStaticConfigs(we, function(err, cfgs) {
        if (err) return done(err);
        var configs = _.merge(dbConfigs, cfgs);
        _.merge(we.configs, dbConfigs);
        done();
      });
    }, 
    function loadModels(next) {
      we.loaders.loadModels(we, function(err, models) {
        if (err) return next(err);
        _.merge(we.modelsConfigs, models);
        next();
      })
    },

    function instantiateModels(next) {
      for ( var modelName in we.modelsConfigs) {
        we.models[modelName] = we.db.define(
          modelName, 
          we.modelsConfigs[modelName].definition, 
          we.modelsConfigs[modelName].options
        );
        we.models[modelName].sync();
      }
      next();
    },

    function loadControllers(next) {
      // load default controller
      we.defaultController = require('./core/controllers/defaultController.js');

      we.loaders.loadControllers(we, function(err, controllers) {
        if (err) return next(err);
        _.merge(we.controllers, controllers);
        next();
      })
    },

    function initExpressPassportAndTheme(next) {
      we.express = weExpress(we);
      // - Passports configs
      wePassport.configureAndSetStrategies(we);
      // - init the theme engine
      themeEngine.init(we);
      next();
    },

    function mergeRoutes(next) {
      we.routes = {};
      // merge plugin routes
      for ( var plugin in we.plugins) {
        _.merge(we.routes, we.plugins[plugin].routes);
      }
      // merge project routes
       _.merge(we.routes, we.configs.routes);
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
       
  ], function (err) {
    if (err) throw new Error(err);
    we.log.info('All loaded, starting the app');
    return cb(err, we);
  });

}

we.startServer = function startExpressServer(cb) {
  /**
   * Get port from environment and store in Express.
   */

  var port = normalizePort(process.env.PORT || '3000');
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
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
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

  cb(null, we);
}

module.exports = we;
