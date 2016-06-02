/**
 * We.js main file, load we.js core and features
 */

// suport for endsWith how needs ES2015
require('string.prototype.endswith');

// Module dependencies.
var async = require('async');
var http = require('http');
var _ = require('lodash');
var path = require('path');
var localization = require('./localization');
var staticConfig = require('./staticConfig');
var Database = require('./Database');
var Email = require('./Email');
var Hooks = require('./Hooks');
var PluginManager = require('./PluginManager');
var Router = require('./Router');
var Sanitizer = require('./Sanitizer');
var EventEmiter = require('events');
// load express and base middlewares
var weExpress = require('./express');

/**
 * We.js object
 *
 * @type {Object}
 */
var We = function WePrototype(options) {
  var we = this;

  this.config = {};

  this.childProcesses = [];

  this.plugins = {};
  this.pluginPaths = [];
  this.pluginNames = [];
  // controllers
  this.controllers = {};

  if (!options) options = {};

  this.projectPath = options.projectPath || process.cwd();
  this.projectConfigFolder = options.projectConfigFolder || path.join(this.projectPath, 'config');

  // start configs with static configs
  this.config = staticConfig(this.projectPath, this);
  // enviroment config prod | dev | test
  we.env = options.env || require('./getEnv.js')();
  // winston logger
  we.log = require('./log')(we);
  // hooks and events
  we.hooks = new Hooks();

  we.events = new EventEmiter();
  we.events.setMaxListeners(70);
  // we.js sanitizer
  we.sanitizer = new Sanitizer(this);
  // The we.js router
  we.router = new Router(this);
  // set add ResponseFormat here for use we.js app
  we.responses.addResponseFormater = function addResponseFormater(extension, formater, position) {
    position = (position === 0 || position)? position: we.config.responseTypes.length;

    we.config.responseTypes.splice(position, 0, extension);

    we.responses.formaters[extension] = formater;
  };

  we.email = new Email(this);

  // we.js prototypes
  we.class = {
    Controller: require('./class/Controller.js'),
    Theme: require('./class/Theme.js')(we),
    Plugin: require('./class/Plugin.js')(we)
  };

  // database logic and models is avaible in we.db.models
  we.db = new Database(this);
  // - init database
  we.db.defaultConnection = we.db.connect(we.env);
  //set for more compatbility with sequelize docs
  we.db.sequelize = we.db.defaultConnection;
  // plugin manager and plugins vars
  we.pluginManager = new PluginManager(this);
  // -- register core bootstrap hooks
  // -- this allows to unregister any step after run we.bootstrap method
  we.bootstrapFunctions = [
    function loadCoreFeatures(we, next) {
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
    function loadPluginFeatures(we, next) {
      we.log.verbose('loadPluginFeatures step');

      we.pluginNames = we.pluginManager.pluginNames;
      // load plugin static configs, merge with old we.config and
      // override the defalt config
      we.config = staticConfig.loadPluginConfigs(we);

      we.hooks.trigger('we:before:load:plugin:features', we, function(){
        async.eachSeries(we.pluginNames, function (pluginName, next) {
          we.plugins[pluginName].loadFeatures(we, next);
        }, function (err) {
          if (err) return next(err);

          we.events.emit('we:after:load:plugins', we);
          next();
        });
      });
    },
    function loadTemplateCache(we, next) {
      // step to plug we-plugin-view
      we.hooks.trigger('we-core:on:load:template:cache', we, next);
    },
    function instantiateModels(we, next) {
      //  step to define all models with sequelize
      we.log.verbose('instantiateModels step');
      we.hooks.trigger('we:models:before:instance', we, function (err) {
        if (err)  return next(err);

        for ( var modelName in we.db.modelsConfigs) {
          // all models have a link permanent
          we.db.modelsConfigs[modelName].definition.linkPermanent = {
            type: we.db.Sequelize.VIRTUAL,
            formFieldType: null,
            get: function() {
              if (this.cachedLinkPermanent) return this.cachedLinkPermanent;
              this.cachedLinkPermanent = this.getUrlPath()
              return this.cachedLinkPermanent;
            }
          };

          // set
          we.db.modelsConfigs[modelName].definition.metadata = {
            type: we.db.Sequelize.VIRTUAL,
            formFieldType: null
          };

          // define the model
          we.db.models[modelName] = we.db.define(
            modelName,
            we.db.modelsConfigs[modelName].definition,
            we.db.modelsConfigs[modelName].options
          );
        }

        // set all associations
        we.db.setModelAllJoins();

        we.hooks.trigger('we:models:set:joins', we, function afterSetJoins(err) {
          if (err)  return next(err);
          next();
        });
      });
    }, function loadControllers(we, next) {
      we.log.verbose('loadControllers step');
      we.loaders.loadControllers(we, function(err, controllers) {
        if (err) return next(err);
        _.merge(we.controllers, controllers);

        we.events.emit('we:after:load:controllers', we);
        next();
      })
    }, function initI18n(we, next) {
      we.log.verbose('initI18n step');
      localization(we);
      we.events.emit('we:after:init:i18n', we);
      next();
    },
    function installAndRegisterPlugins(we, next) {
      if (we.config.skipInstall) return next();

      we.log.verbose('installAndRegisterPluginsIfNeed step');
      // dont have plugins to install
      if (!we.pluginManager.pluginsToInstall) return next();
      // sync all model before start the install scripts
      we.db.defaultConnection.sync().then(function afterSyncAllPluginTables() {
        // get plugins to install names
        var names = Object.keys(we.pluginManager.pluginsToInstall);
        async.eachSeries(names, function onEachPlugin(name, nextPlugin) {
          // run install scripts
          we.pluginManager.installPlugin(name, function afterInstallOnePlugin (err){
            if (err) return nextPlugin(err);
            // register it
            we.pluginManager.registerPlugin(name, nextPlugin);
          });
        }, function afterInstallAllPlugins (err){
          if (err) return next(err);
          next();
        });
      }).catch(next);
    },
    function setExpressApp(we, next) {
      // load express
      we.express = weExpress(we);
      we.events.emit('we:after:load:express', we);
      next();
    },
    function passport(we, next) {
      // hook to set authentication.
      // if we-plugin-auth is installed, load passport here
      we.hooks.trigger('we-core:on:set:passport', we, next);
    },
    function createDefaultFolders(we, next) {
      we.log.verbose('createDefaultFolders step');
      we.hooks.trigger('we:create:default:folders', we, function() {
        next();
      });
    },
    function loadEmailTemplates(we, next) {
      we.log.verbose('loadEmailTemplates step');
      we.email.init(we);

      we.email.loadEmailTemplates(we, function (err, templates) {
        if (err) return next(err);
        we.email.templates = templates;
        next();
      });
    },
    function registerAllViewTemplates(we, next) {
      // hook to plugin we-plugin-view template register
      we.hooks.trigger('we-core:on:register:templates', we, next);
    },
    function mergeRoutes(we, next) {
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
    /**
     * Bind all resources in App
     *
     * @param  {Object}   we
     * @param  {Function} next
     */
    function bindResources(we, next) {
      we.log.verbose('bindResources step');
      try {
        for (var resource in we.router.resources) {
          we.router.bindResource(we.router.resources[resource]);
        }
        next();
      } catch (e) {
        next(e);
      }
    },

    function bindRoutes(we, next) {
      we.log.verbose('bindRoutes step');
      we.hooks.trigger('we:before:routes:bind', we, function beforeRouteBind() {
        for (var route in we.routes) {
          we.router.bindRoute(we, route, we.routes[route] );
        }

        we.hooks.trigger('we:after:routes:bind', we, function afterRouteBind() {
          // bind after router handler for run responseMethod
          we.express.use(function (req, res, done) {
            if (res.responseMethod) return res[res.responseMethod]();
            done();
          });

          next();
        });
      });
    }
  ];
  we.hooks.on('bootstrap', we.bootstrapFunctions);
};
// flag to check if this we.js instance did the bootstrap
We.prototype.bootstrapStarted = false;
  // flag to check if needs restart
We.prototype.needsRestart = false;
// we.utils.async, we.utils._ ... see the ./utils file
We.prototype.utils = require('./utils');
// helper functions to load we.js resources
We.prototype.loaders = require('./loaders');
// load we.js responses
We.prototype.responses = require('./responses');
  // save we-core path to plugin.js for update e install process
We.prototype.weCorePluginfile = path.resolve(__dirname, '../') + '/plugin.js';

//Overide default toString and inspect to custom infos in we.js object
We.prototype.inspect = function inspect() {
  return '\nWe.js ;)\n';
};
We.prototype.toString = We.prototype.inspect;

// client side config generator
We.prototype.getAppBootstrapConfig = require('./staticConfig/getAppBootstrapConfig.js');

/**
 * Bootstrap and initialize the app
 *
 * @param  {Object}   configOnRun optional
 * @param  {Function} cb          callback to run after load we.js
 */
We.prototype.bootstrap = function bootstrap(configOnRun, cb) {
  var we = this;
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

  // run the bootstrap hook
  we.hooks.trigger('bootstrap', we, function bootstrapDone(err) {
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
We.prototype.startServer = function startExpressServer(cb) {
  if (!cb) cb = function(){}; // cb is optional

  var we = this;
  we.hooks.trigger('we:server:before:start' ,we ,function afterRunBeforeServerStart (err){
    if (err) return cb(err);
    /**
     * Get port from environment and store in Express.
     */
    var port = normalizePort(we.config.port);
    we.express.set('port', port);

    /**
     * Create HTTP server with suport to url alias rewrite
     */
    var server = http.createServer(function onCreateServer (req, res){
      req.we = we;

      // suport for we.js widget API
      // install we-plugin-widget to enable this feature
      if (req.headers && req.headers['we-widget-action'] && req.method == 'POST') {
        req.isWidgetAction = true;
        req.originalMethod = req.method;
        req.method = 'GET'; // widgets only are associated to get routes
      }

      // parse extension if not is public folder
      if (!we.router.isPublicFolder(req.url)) {
        req.extension = we.router.splitExtensionFromURL(req.url);
        if (req.extension) {
          // check if is valid this extension and is one of acceptable extensions
          if (we.config.responseTypes.indexOf(req.extension) >-1) {
            req.url = req.url.replace('.'+req.extension, '');
          } else {
            req.extension = null;
          }
        }
      }
      // install we-plugin-url-alias to enable alias feature
      if (we.plugins['we-plugin-url-alias'] && we.config.enableUrlAlias) {
        we.router.alias.httpHandler.bind(this)(req, res);
      } else {
        we.express.bind(this)(req, res);
      }
    });

    we.events.emit('we:server:after:create', { we: we, server: server });

    /**
     * Listen on provided port, on all network interfaces.
     */

    // catch 404 and forward to error handler
    we.express.use(function routeNotFound (req, res){
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
    function normalizePort (val){
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
    function onError (error){
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
      we.log.info('Run in '+we.env+' enviroment and listening on ' + bind);
    }
    // save the current http server
    we.http = server;

    // express error handlers
    // will print stacktrace
    we.express.use(function onExpressError(err, req, res, next) {
      we.log.error('onExpressError:Error on:', req.path, err);
      res.serverError(err);
    });

    we.hooks.trigger('we:server:after:start',we, function afterHookAfterStart(err) {
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
We.prototype.go = function go (cfgs, cb){
  if (!cb) {
    cb = cfgs;
    cfgs = {};
  }

  this.bootstrap(cfgs, function afterBootstrapOnWeGo (err, we){
    if (err) throw err;
    we.startServer(cb);
  });
}

/**
 * Turn off process function
 *
 * @param  {Function} cb callback
 */
We.prototype.exit = function exit (cb){
  this.db.defaultConnection.close();
  cb();
}

/**
 * Helper function to delete (unpoint) pointers from response for help GC
 */
We.prototype.freeResponseMemory = function freeResponseMemory (req, res){
  delete res.locals.req;
  delete res.locals.regions;
  delete res.locals.Model;
  delete res.locals.body;
  delete res.locals.layoutHtml;
}

/**
 * Run all plugin and project cron tasks
 *
 * @param  {Function} cb callback
 */
We.prototype.runCron = function runCron (cb){
  this.cron = require('./cron');
  this.cron.loadAndRunAllTasks(this, cb);
}

module.exports = We;