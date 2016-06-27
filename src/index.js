/**
 * We.js main file, load we.js core and features
 */

// Module dependencies.
import http from 'http'
import _ from 'lodash'
import path from 'path'
import staticConfig from './staticConfig'
import Database from './Database'
import Hooks from './Hooks'
import PluginManager from './PluginManager'
import Router from './Router'
import Sanitizer from './Sanitizer'
import EventEmiter from 'events'
import { readFileSync, writeFileSync, writeFile } from 'fs'

/**
 * We.js object
 *
 * @type {Object}
 */
function We (options) {
  if (!options) options = {}

  let we = this

  this.packageJSON = require('../package.json');

  this.config = options || {}

  this.childProcesses = []

  this.plugins = {}
  this.pluginPaths = []
  this.pluginNames = []
  // controllers
  this.controllers = {}

  this.projectPath = options.projectPath || process.cwd()

  this.projectPackageJSON = require(path.resolve(this.projectPath, 'package.json'))

  this.projectConfigFolder = options.projectConfigFolder || path.join(this.projectPath, 'config')

  // start configs with static configs
  this.config = staticConfig(this.projectPath, this)
  // enviroment config prod | dev | test
  we.env = options.env || require('./getEnv.js')()
  // winston logger
  we.log = require('./log')(we)
  // hooks and events
  we.hooks = new Hooks()

  we.events = new EventEmiter()
  we.events.setMaxListeners(70)
  // we.js sanitizer
  we.sanitizer = new Sanitizer(this)
  // The we.js router
  we.router = new Router(this)
  // we.js prototypes
  we.class = {
    Controller: require('./class/Controller.js'),
    Theme: require('./class/Theme.js')(we),
    Plugin: require('./class/Plugin.js')(we)
  }

  // database logic and models is avaible in we.db.models
  we.db = new Database(this)
  // - init database
  we.db.defaultConnection = we.db.connect(we.env)
  //set for more compatbility with sequelize docs
  we.db.sequelize = we.db.defaultConnection
  // plugin manager and plugins vars
  we.pluginManager = new PluginManager(this)

  switch (we.config.bootstrapMode) {
    case 'install':
    case 'installation':
    case 'update':
      we.hooks.on('bootstrap', [
        we.bootstrapFunctions.loadCoreFeatures,
        we.bootstrapFunctions.loadPluginFeatures,
        we.bootstrapFunctions.loadTemplateCache,
        we.bootstrapFunctions.instantiateModels,
        we.bootstrapFunctions.syncModels,
        we.bootstrapFunctions.loadControllers,
        we.bootstrapFunctions.initI18n,
        we.bootstrapFunctions.installAndRegisterPlugins
      ])
      break
    case 'complete':
    case 'full':
    case 'test':
      // full load, usefull for tests
      we.hooks.on('bootstrap', [
        we.bootstrapFunctions.loadCoreFeatures,
        we.bootstrapFunctions.loadPluginFeatures,
        we.bootstrapFunctions.loadTemplateCache,
        we.bootstrapFunctions.instantiateModels,
        we.bootstrapFunctions.syncModels,
        we.bootstrapFunctions.loadControllers,
        we.bootstrapFunctions.initI18n,
        we.bootstrapFunctions.installAndRegisterPlugins,
        we.bootstrapFunctions.setExpressApp,
        we.bootstrapFunctions.passport,
        we.bootstrapFunctions.createDefaultFolders,
        we.bootstrapFunctions.registerAllViewTemplates,
        we.bootstrapFunctions.mergeRoutes,
        we.bootstrapFunctions.bindResources,
        we.bootstrapFunctions.bindRoutes
      ])
      break
    default:
      // defaults to load for run
      we.hooks.on('bootstrap', [
        we.bootstrapFunctions.loadCoreFeatures,
        we.bootstrapFunctions.loadPluginFeatures,
        we.bootstrapFunctions.loadTemplateCache,
        we.bootstrapFunctions.instantiateModels,
        we.bootstrapFunctions.syncModels,
        we.bootstrapFunctions.loadControllers,
        we.bootstrapFunctions.initI18n,
        we.bootstrapFunctions.installAndRegisterPlugins,
        we.bootstrapFunctions.setExpressApp,
        we.bootstrapFunctions.passport,
        we.bootstrapFunctions.createDefaultFolders,
        we.bootstrapFunctions.registerAllViewTemplates,
        we.bootstrapFunctions.mergeRoutes,
        we.bootstrapFunctions.bindResources,
        we.bootstrapFunctions.bindRoutes
      ])
  }
}

/**
 * Set config in config/configuration.json file
 *
 * @param {String}   variable path to the variable
 * @param {String}   value
 * @param {Function} cb       callback
 */
We.prototype.setConfig = function setConfig (variable, value, cb) {
  if (!cb) cb = function(){}

  var cJSON,
      cFGpath = path.join(this.projectPath, '/config/configuration.json')

  try {
    cJSON = JSON.parse(readFileSync(cFGpath))
  } catch(e) {
    if (e.code == 'ENOENT') {
      writeFileSync(cFGpath, '{}')
      cJSON = {}
    } else {
      return cb(e)
    }
  }

  if (value == 'true') value = true
  if (value == 'false') value = false

  _.set(cJSON, variable, value)

  writeFile(cFGpath, JSON.stringify(cJSON, null, 2), cb)
}

/**
 * Unset config in config/configuration.json file
 *
 * @param {String}   variable path to the variable
 * @param {String}   value
 * @param {Function} cb       callback
 */
We.prototype.unSetConfig = function unSetConfig (variable, cb) {
  var cJSON,
      cFGpath = path.join(this.projectPath, '/config/configuration.json')

  try {
    cJSON = JSON.parse(readFileSync(cFGpath))
  } catch(e) {
    if (e.code == 'ENOENT') {
      writeFileSync(cFGpath, '{}')
      cJSON = {}
    } else {
      return cb(e)
    }
  }

  _.unset(cJSON, variable)

  writeFile(cFGpath, JSON.stringify(cJSON, null, 2), cb)
}
// set bootstrap functions
We.prototype.bootstrapFunctions = require('./bootstrapFunctions');
// flag to check if this we.js instance did the bootstrap
We.prototype.bootstrapStarted = false
  // flag to check if needs restart
We.prototype.needsRestart = false
// we.utils.async, we.utils._ ... see the ./utils file
We.prototype.utils = require('./utils')
// load we.js responses
We.prototype.responses = require('./responses')
  // save we-core path to plugin.js for update e install process
We.prototype.weCorePluginfile = path.resolve(__dirname, '../') + '/plugin.js'

//Overide default toString and inspect to custom infos in we.js object
We.prototype.inspect = function inspect() {
  return '\nWe.js ;)\n'
};
We.prototype.toString = We.prototype.inspect

// client side config generator
We.prototype.getAppBootstrapConfig = require('./staticConfig/getAppBootstrapConfig.js')

/**
 * Bootstrap and initialize the app
 *
 * @param  {Object}   configOnRun optional
 * @param  {Function} cb          callback to run after load we.js
 */
We.prototype.bootstrap = function bootstrap (configOnRun, cb) {
  let we = this
  // only bootstrap we.js one time
  if (we.bootstrapStarted) throw new Error('We.js already did bootstrap')

  we.bootstrapStarted = true
  // configsOnRun object is optional
  if (!cb) {
    cb = configOnRun
    configOnRun = null
  }
  // configs on run extends default and file configs
  if (configOnRun) _.merge(we.config, configOnRun)

  // run the bootstrap hook
  we.hooks.trigger('bootstrap', we, function bootstrapDone (err) {
    if (err) {
      console.log('Error on bootstrap: ')
      throw err
    }

    we.events.emit('we:bootstrap:done', we)

    we.log.debug('We.js bootstrap done')
    return cb(null, we)
  });
}

/**
 * Start we.js server (express)
 * use after we.bootstrap
 *
 * @param  {Function} cb    callback how returns with cb(err);
 */
We.prototype.startServer = function startExpressServer(cb) {
  if (!cb) cb = function(){} // cb is optional

  let we = this
  we.hooks.trigger('we:server:before:start' ,we ,function afterRunBeforeServerStart (err) {
    if (err) return cb(err)
    /**
     * Get port from environment and store in Express.
     */
    var port = normalizePort(we.config.port)
    we.express.set('port', port)

    /**
     * Create HTTP server with suport to url alias rewrite
     */
    var server = http.createServer(function onCreateServer (req, res){
      req.we = we

      // suport for we.js widget API
      // install we-plugin-widget to enable this feature
      if (req.headers && req.headers['we-widget-action'] && req.method == 'POST') {
        req.isWidgetAction = true
        req.originalMethod = req.method
        req.method = 'GET' // widgets only are associated to get routes
      }

      // parse extension if not is public folder
      if (!we.router.isPublicFolder(req.url)) {
        req.extension = we.router.splitExtensionFromURL(req.url)

        if (req.extension) {
          let format = we.utils.mime.lookup(req.extension)

          if (req.we.config.responseTypes.includes(format)) {
            // update the header response format with extension format
            req.headers.accept = format
            // update the old url
            req.url = req.url.replace('.'+req.extension, '')
          }
        }
      }
      // install we-plugin-url-alias to enable alias feature
      if (we.plugins['we-plugin-url-alias'] && we.config.enableUrlAlias) {
        we.router.alias.httpHandler.bind(this)(req, res)
      } else {
        we.express.bind(this)(req, res)
      }
    });

    we.events.emit('we:server:after:create', { we: we, server: server })

    /**
     * Listen on provided port, on all network interfaces.
     */

    // catch 404 and forward to error handler
    we.express.use(function routeNotFound (req, res) {
      we.log.debug('Route not found:', req.path)
      // var err = new Error('Not Found');
      // err.status = 404;
      return res.notFound()
    });

    server.listen(port)
    server.on('error', onError)
    server.on('listening', onListening)
    /**
     * Normalize a port into a number, string, or false.
     */
    function normalizePort (val) {
      let port = parseInt(val, 10)

      if (isNaN(port)) {
        // named pipe
        return val
      }

      if (port >= 0) {
        // port number
        return port
      }

      return false
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    function onError (error) {
      if (error.syscall !== 'listen') {
        throw error
      }

      var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges')
          process.exit(1)
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use')
          process.exit(1)
          break
        default:
          throw error
      }
    }
    /**
     * Event listener for HTTP server "listening" event.
     */
    function onListening () {
      var addr = server.address()
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
      we.log.info('Run in '+we.env+' enviroment and listening on ' + bind)
    }
    // save the current http server
    we.http = server

    // express error handlers
    // will print stacktrace
    we.express.use(function onExpressError (err, req, res, next) {
      we.log.error('onExpressError:Error on:', req.path, err)
      res.serverError(err)
    })

    we.hooks.trigger('we:server:after:start',we, function afterHookAfterStart (err) {
      cb(err, we)
    })
  })
}

/**
 * Bootstrap and Start we.js server
 *
 * @param  {Object}   cfgs configs (optional)
 * @param  {Function} cb   callback
 */
We.prototype.go = function go (cfgs, cb) {
  if (!cb) {
    cb = cfgs
    cfgs = {}
  }

  this.bootstrap(cfgs, function afterBootstrapOnWeGo (err, we) {
    if (err) throw err
    we.startServer(cb)
  })
}

/**
 * Turn off process function
 *
 * @param  {Function} cb callback
 */
We.prototype.exit = function exit (cb) {
  this.db.defaultConnection.close()
  cb()
}

/**
 * Helper function to delete (unpoint) pointers from response for help GC
 */
We.prototype.freeResponseMemory = function freeResponseMemory (req, res) {
  delete res.locals.req
  delete res.locals.regions
  delete res.locals.Model
  delete res.locals.body
  delete res.locals.layoutHtml
}

/**
 * Run all plugin and project cron tasks
 *
 * @param  {Function} cb callback
 */
We.prototype.runCron = function runCron (cb) {
  this.cron = require('./cron')
  this.cron.loadAndRunAllTasks(this, cb)
}

module.exports = We
