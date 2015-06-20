#!/usr/bin/env node

/**
 * Module dependencies.
 */

var async = require('async');
var express = require('express');
var http = require('http');
var weIo = require('./socket.io');
var _ = require('lodash');
var wePassport = require('./auth/passport');
var pluginManager = require('./pluginManager');
var localization = require('./localization');
var exec = require('child_process').exec;

var we = {};

we.hooks = require('./hooks');
we.events = require('./events');

we.url = require('./url');

// project path
we.projectPath = process.cwd();

// - Configure Logger
we.log = require('./log')(we.projectPath);

we.acl = require('./acl');

// start and load db
we.db = require('./database/index.js');

we.sanitizer = require('./sanitizer');

we.loaders = require('./loaders.js');
we.router = require('./router.js');
we.config = require('./staticConfig')(we.projectPath);

// client side config generator
we.getAppBootstrapConfig = require('./staticConfig/getAppBootstrapConfig.js');

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

we.antiSpam = require('./antiSpam');

we.childProcesses = [];

// load we.js auth logic
we.auth = require('./auth');

we.db.models = {};
we.db.modelsConfigs = {};

we.view = require('./view');
we.view.initialize(we);

we.controllers = {};
var weExpress = require('./express');
// we.js classes
we.class = require('./class/index.js');
// save a reference to we.js object
we.class.Plugin.prototype.we = we;

we.email = require('./email');

// enviroment config prod | dev | test
we.env = require('./env.js');

we.getRouter = function() {
  return express.Router();
}

we.bootstrapStarted = false;

/**
 * Bootstrap and initialize the app
 *
 */
we.bootstrap = function bootstrap(configOnRun, cb) {
  if (we.bootstrapStarted) throw new Error('We.js already did bootstrap');
  we.bootstrapStarted = true;

  if (!cb) {
    cb = configOnRun;
    configOnRun = null;
  }

  if (configOnRun) _.merge(we.config, configOnRun);

  async.series([
    function loadPluginFeatures(next) {
      we.log.verbose('loadPluginFeatures step');
      for (var pluginName in we.plugins) {
        // run all plugins loadFeatures function
        we.plugins[pluginName].loadFeatures(we);
      }
      // load plugin widgets
      for (var widgetName in we.view.configuration.widgets) {
        we.view.widgets[widgetName] =
          require(we.view.configuration.widgets[widgetName])(we.projectPath, we.class.Widget);
      }

      we.events.emit('we:after:load:plugins', we);

      next();
    },

    function checkRequirements(next) {
      we.log.verbose('checkRequirements step');

      we.hooks.trigger('we:check:requirements', we, function (err) {
        if (err) return next(err);
        exec('gm version', function (error) {
          if (error) {
            return next('Requirement GraphicsMagick not found or not instaled, see: https://github.com/aheckmann/gm');
          }

          return next();
        });
      });
    },

    function loadModels(next) {
      we.log.verbose('loadModels step');
      we.loaders.loadModels(we, function(err, models) {
        if (err) return next(err);
        _.merge(we.db.modelsConfigs, models);
        next();
      })
    },

    function instantiateModels(next) {
      we.log.verbose('instantiateModels step');
      we.hooks.trigger('we:models:before:instance', we, function(err) {
        if (err)  return next(err);

        for ( var modelName in we.db.modelsConfigs) {
          we.db.models[modelName] = we.db.define(
            modelName,
            we.db.modelsConfigs[modelName].definition,
            we.db.modelsConfigs[modelName].options
          );
        }

        we.db.setModelAllJoins();

        we.hooks.trigger('we:models:set:joins', we, function afterSetJoins(err) {
          if (err)  return next(err);
          we.db.syncAllModels(we.config.database, next);
        });
      });
    },

    function initACL(next) {
      we.log.verbose('initACL step');
      we.acl.init(we, next);
    },

    function loadControllers(next) {
      we.log.verbose('loadControllers step');
      we.loaders.loadControllers(we, function(err, controllers) {
        if (err) return next(err);
        _.merge(we.controllers, controllers);

        we.events.emit('we:after:load:controllers', we);
        next();
      })
    },

    function initExpressAndPassport(next) {
      we.log.verbose('initExpressPassport step');
      // load we.js responses
      we.responses = require('./responses');
      // load express
      we.express = weExpress(we);
      we.events.emit('we:after:load:express', we);
      // - Passports configs
      wePassport.configureAndSetStrategies(we);
      we.events.emit('we:after:load:passport', we);
      // admin env middleware
      we.express.get('/admin*', function adminPage(req ,res, next) {
        res.locals.isAdmin = true;
        res.locals.theme = 'admin';
        res.locals.template = 'home/index';
        return next();
      });

      next();
    },

    function initI18n(next) {
      we.log.verbose('initI18n step');
      localization(we);
      we.events.emit('we:after:init:i18n', we);
      next();
    },

    function createDefaultFolders(next) {
      we.log.verbose('createDefaultFolders step');
      we.hooks.trigger('we:create:default:folders', we, function() {
        next();
      });
    },

    function loadEmailTemplates(next) {
      we.log.verbose('loadEmailTemplates step');
      we.email.init(we);

      we.loaders.loadEmailTemplates(we, function(err, templates) {
        if (err) return next(err);

        we.email.templates = templates;

        next();
      });
    },

    function registerAllViewTemplates(next) {
      we.log.verbose('registerAllViewTemplates step');
      we.view.registerAll();
      next();
    },

    function mergeRoutes(next) {
      we.log.verbose('mergeRoutes step');
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
      we.log.verbose('bindRoutes step');
      we.hooks.trigger('we:before:routes:bind', we, function beforeRouteBind() {
        // bind dinamic url
        we.express.get('*', we.url.middleware);

        for (var route in we.routes) {
          we.router.bindRoute(we, route, we.routes[route] );
        }

        we.hooks.trigger('we:after:routes:bind', we, function afterRouteBind() {

          // bind after router handler for run responseMethod
          we.express.use(function(req, res, done) {
            if (res.responseMethod) return res[res.responseMethod]();
            done();
          });

          next();
        });
      });
    }
  ], function bootstrapDone(err) {
    if (err) {
      console.error('Error on we.js bootstrap: ', err);
      return cb(err);
    }

    we.events.emit('we:bootstrap:done', we);

    we.log.debug('We.js bootstrap done');
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

  weIo.load(we, server);

  /**
   * Listen on provided port, on all network interfaces.
   */

  // catch 404 and forward to error handler
  we.express.use(function routeNotFound(req, res) {
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
    we.log.info('Listening on ' + bind);
  }

  // save the current server
  we.http = server;

  // express error handlers
  // development error handler
  // will print stacktrace
  we.express.use(function onExpressError(err, req, res, next) {
    we.log.error('Error on:', req.path, err);
    res.serverError();
  });

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

/**
 * Turn off process function
 *
 * @param  {Function} cb callback
 */
we.exit = function exit(cb) {

  we.db.defaultConnection.close();

  cb();
}


module.exports = we;
