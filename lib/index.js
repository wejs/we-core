/**
 * We.js main file, load we.js features
 *
 */

// suport for endsWith how needs ES2015
require('string.prototype.endswith');

// Module dependencies.
var async = require('async');
var express = require('express');
var http = require('http');
var _ = require('lodash');
var path = require('path');
var wePassport = require('./auth/passport');
var localization = require('./localization');
var exec = require('child_process').exec;
var staticConfig = require('./staticConfig');
var projectPath = process.cwd();

/**
 * We.js object
 *
 * @type {Object}
 */
var we = {
  projectPath: projectPath,
  // enviroment config prod | dev | test
  env: require('./env.js'),
  // winston logger
  log: require('./log')(projectPath),
  // we.utils.async, we.utils._ ... see the ./utils file
  utils: require('./utils'),
  // hooks and events
  hooks: require('./hooks'),
  events: require('./events'),
  // database logic and models is avaible in we.db.models
  db: require('./database'),
  // Access Control List
  acl: require('./acl'),
  // we.js prototypes
  class: require('./class'),
  // start configs with static configs
  config: staticConfig(projectPath),
  // we.js sanitizer
  sanitizer: require('./sanitizer'),
  // helper functions to load we.js resources
  loaders: require('./loaders'),
  // view logic
  view: require('./view'),
  // The we.js router
  router: require('./router'),
  email: require('./email'),
  bootstrapStarted: false,
  childProcesses:[],
  // plugin manager and plugins vars
  pluginManager: require('./pluginManager'),
  plugins: {},
  pluginPaths: [],
  pluginNames: [],
  // controllers
  controllers: {},
  // load we.js responses
  responses: require('./responses'),
  // save we-core path to plugin.js for update e install process
  weCorePluginfile: path.resolve(__dirname, '../') + '/plugin.js',
  // flag to check if needs restart
  needsRestart: false
};
//Overide default toString and inspect to custom infos in we.js object
we.inspect = function inspect() {
  return '\nWe.js ;)\n';
};
we.toString = we.inspect;
// - init database
we.db.defaultConnection = we.db.connect(we.env);
//set for more compatbility with sequelize docs
we.db.sequelize = we.db.defaultConnection;
// client side config generator
we.getAppBootstrapConfig = require('./staticConfig/getAppBootstrapConfig.js');
we.antiSpam = require('./antiSpam');
// load we.js auth logic
we.auth = require('./auth');

we.view.initialize(we);
// load express and base middlewares
var weExpress = require('./express');
// save a reference to we.js object in plugin prototype
we.class.Plugin.prototype.we = we;
// helper function to get express Router
we.getRouter = function getRouter() { return express.Router(); }

/**
 * Bootstrap and initialize the app
 *
 * @param  {Object}   configOnRun optional
 * @param  {Function} cb          callback to run after load we.js
 */
we.bootstrap = function bootstrap(configOnRun, cb) {
  // only bootstrap we.js one time
  if (we.bootstrapStarted) throw new Error('We.js already did bootstrap');
  we.bootstrapStarted = true;
  // configsOnRun object is optional
  if (!cb) {
    cb = configOnRun;
    configOnRun = null;
  }
  // configs on run extends default and file configs
  if (configOnRun) _.merge(we.config, configOnRun);
  // run all bootstrap steps in series
  async.series([
    function loadCoreFeatures(next) {
      we.log.verbose('loadCoreFeatures step');

      we.db.loadCoreModels(function(err) {
        if(err) return next(err);

        we.pluginManager.loadPluginsSettingsFromDB(we, function (err){
          if (err) return next(err);
          // preload all plugins
          we.pluginManager.loadPlugins(we, function (err, plugins) {
            if (err) return next(err);
            we.plugins = plugins;
            next();
          });
        });
      });
    },

    function loadPluginFeatures(next) {
      we.log.verbose('loadPluginFeatures step');

      we.pluginNames = we.pluginManager.pluginNames;
      // load plugin static configs, merge with old we.config and
      // override the defalt config
      we.config = staticConfig.loadPluginConfigs();

      async.eachSeries(we.pluginNames, function (pluginName, next) {
        we.plugins[pluginName].loadFeatures(we, next);
      }, function (err) {
        if (err) return next(err);
        // load plugin widgets
        for (var widgetName in we.view.configuration.widgets) {
          we.view.widgets[widgetName] =
            require(we.view.configuration.widgets[widgetName])(we.projectPath, we.class.Widget);
        }

        we.events.emit('we:after:load:plugins', we);
        next();
      })
    },

    // TODO move checkRequirements to we.js CLI action
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
          next();
        });
      });
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

    function installAndRegisterPluginsIfNeed(next) {
      we.log.verbose('installAndRegisterPluginsIfNeed step');
      // dont have plugins to install
      if (!we.pluginManager.pluginsToInstall) return next();
      // sync all model before start the install scripts
      we.db.defaultConnection.sync().then(function() {
        // get plugins to install names
        var names = Object.keys(we.pluginManager.pluginsToInstall);
        async.eachSeries(names, function (name, nextPlugin) {
          // run install scripts
          we.pluginManager.installPlugin(name, function (err){
            if (err) return nextPlugin(err);
            // register it
            we.pluginManager.registerPlugin(name, nextPlugin);
          });
        }, function (err) {
          if (err) return next(err);
          next();
        });
      }).catch(next);
    },

    function initACL(next) {
      we.log.verbose('initACL step');
      we.acl.init(we, next);
    },

    function initExpressAndPassport(next) {
      we.log.verbose('initExpressPassport step');
      // load express
      we.express = weExpress(we);
      we.events.emit('we:after:load:express', we);
      // - Passports configs
      wePassport.configureAndSetStrategies(we);
      we.events.emit('we:after:load:passport', we);
      // admin env middleware
      we.express.get('/admin*', function adminPage(req ,res, next) {
        res.locals.isAdmin = true;
        res.locals.theme = we.view.adminTheme;
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

      we.email.loadEmailTemplates(we, function (err, templates) {
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
    },
    function bindResources(next) {
      for (var resource in we.router.resources) {
        we.router.bindResource(we.router.resources[resource]);
      }

      next();
    }
  ], function bootstrapDone(err) {
    if (err) {
      console.trace();
      console.error('Error on we.js bootstrap: ', err);
      return cb(err);
    }

    we.events.emit('we:bootstrap:done', we);

    we.log.debug('We.js bootstrap done');
    return cb(null, we);
  });
}

/**
 * Start we.js server (express)
 * use after we.bootstrap
 *
 * @param  {Function} cb    callback how returns with cb(err);
 */
we.startServer = function startExpressServer(cb) {
  we.hooks.trigger('we:server:before:start',we, function (err) {
    if (err) return cb(err);
    /**
     * Get port from environment and store in Express.
     */
    var port = normalizePort(we.config.port);
    we.express.set('port', port);

    /**
     * Create HTTP server.
     */
    var server = http.createServer(we.express);

    we.events.emit('we:server:after:create', { we: we, server: server});

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
    // save the current http server
    we.http = server;
    // express error handlers
    // will print stacktrace
    we.express.use(function onExpressError(err, req, res) {
      we.log.error('Error on:', req.path, err);
      res.serverError();
    });

    we.hooks.trigger('we:server:after:start',we, function (err) {
      cb(err, we);
    });
  });
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

/**
 * Run all plugin and project cron tasks
 *
 * @param  {Function} cb callback
 */
we.runCron = function runCron(cb) {
  we.cron = require('./cron');
  we.cron.loadAndRunAllTasks(we, cb);
}

module.exports = we;
