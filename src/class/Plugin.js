/**
 * We.js Plugin prototype file
 */

const _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  async = require('async')

module.exports = function getPluginPrototype (we) {
  /**
   * We.js plugin Class constructor
   *
   * @param {string} name   plugin npm pakage name
   * @param {string} projectPath project path where the plugin is instaled
   */
  function Plugin (pluginPath) {
    this.pluginPath = pluginPath
    this.we = we

    this.events = this.we.events
    this.hooks = this.we.hooks
    this.router = this.we.router
    /**
     * Plugin Assets
     * @type {Object}
     */
    this.assets = {
      js: {},
      css: {}
    }

    this['package.json'] = require( path.join( pluginPath , 'package.json') )

    this.controllersPath = path.join( this.pluginPath,  this.controllerFolder )
    this.modelsPath = path.join( this.pluginPath,  this.modelFolder )
    this.modelHooksPath = path.join( this.pluginPath,  this.modelHookFolder )
    this.modelInstanceMethodsPath = path.join( this.pluginPath,  this.modelInstanceMethodFolder )
    this.modelClassMethodsPath = path.join( this.pluginPath,  this.modelClassMethodFolder )

    this.searchParsersPath = path.join( this.pluginPath, this.searchParsersFolder )
    this.searchTargetsPath = path.join( this.pluginPath, this.searchTargetsFolder )

    this.templatesPath = this.pluginPath + '/server/templates'
    this.helpersPath = this.pluginPath + '/server/helpers'
    this.resourcesPath = this.pluginPath + '/server/resources'
    this.routesPath = this.pluginPath + '/server/routes'

    this.helpers = {}
    this.layouts = {}
    this.templates = {}

    /**
     * Default plugin config object
     *
     * @type {Object}
     */
    this.configs = {}


    /**
     * Default plugin resources
     *
     * @type {Object}
     */
    this.controllers = {}
    this.models = {}
    this.routes = {}

    this.appFiles = []
    this.appAdminFiles = []
  }

  /**
   * Default initializer function, override in plugin.js file if need
   *
   * @param  {Object} we  we.js object
   * @param  {Function} cb callback
   */
  Plugin.prototype.init = function initPlugin(we, cb) { return cb() }

  /**
   * Set plugin config
   * @param {Object} config
   */
  Plugin.prototype.setConfigs = function setConfigs (configs) {
    this.configs = configs
  }

  // default plugin paths
  Plugin.prototype.controllerFolder = 'server/controllers'
  Plugin.prototype.modelFolder = 'server/models'
  Plugin.prototype.modelHookFolder = 'server/models/hooks'
  Plugin.prototype.modelInstanceMethodFolder = 'server/models/instanceMethods'
  Plugin.prototype.modelClassMethodFolder = 'server/models/classMethods'
  Plugin.prototype.searchParsersFolder = 'server/search/parsers'
  Plugin.prototype.searchTargetsFolder = 'server/search/targets'

  /**
   * Set plugin routes
   *
   * @param {object} routes
   */
  Plugin.prototype.setRoutes = function setRoutes (routes) {
    var routePaths = Object.keys(routes)
    var routePath
    for (var i = routePaths.length - 1; i >= 0; i--) {
      routePath = routePaths[i]
      this.setRoute(routePath, routes[routePath])
    }
  }

  /**
   * Set one route in plugin routes
   * @param {string} path    route path
   * @param {object} configs route configs how will be avaible as res.locals
   */
  Plugin.prototype.setRoute = function setRoute (routePath, configs) {
    this.routes[routePath] = configs
    this.routes[routePath].path = routePath
    this.routes[routePath].pluginPath = this.pluginPath
  }

  Plugin.prototype.setResource = function setResource (opts) {
    let router = this.we.router,
        fullName = (opts.namePrefix || '') + opts.name

    // first save resource in name or merge route options if exists
    if (!router.resourcesByName[fullName]) {
      router.resourcesByName[fullName] = opts;
    } else {
      _.merge(router.resourcesByName[fullName], opts);
    }

    if (opts.parent) {
    // is subroute
      if (!router.resourcesByName[opts.parent]) {
      // parent dont are set
        // temporary create parent resource wit subroutes attr
        router.resourcesByName[opts.parent] = { subRoutes: {} }
        // add reference to route in parent subroutes
        router.resourcesByName[opts.parent].subRoutes[fullName] = router.resourcesByName[fullName]
      } else {
      // parent resource is set
        if (!router.resourcesByName[opts.parent].subRoutes) {
          // add subRoutes object if dont are set
          router.resourcesByName[opts.parent].subRoutes = {}
        }
        if (!router.resourcesByName[opts.parent].subRoutes[fullName]) {
          router.resourcesByName[opts.parent].subRoutes[fullName] = {}
        }
        // add reference to route in parent resource subroutes
        router.resourcesByName[opts.parent].subRoutes[fullName] = router.resourcesByName[fullName]
      }
    } else {
      // is route route
      router.resources[fullName] = router.resourcesByName[fullName]
    }
  }

  /**
   * Set plugin layouts
   * @param {object} layouts
   */
  Plugin.prototype.setLayouts = function setLayouts (layouts) {
    this.layouts = layouts
  }

  /**
   * Load all we.js plugin features
   *
   * Auto load avaible for plugins, helpers ...
   *
   */
  Plugin.prototype.loadFeatures = function loadFeatures (we, cb) {
    var self = this

    async.parallel([
      next => self.loadSearchParsers(next),
      next => self.loadSearchTargets(next),
      next => self.loadControllers(next),
      next => self.loadModelHooks(next),
      next => self.loadInstanceMethods(next),
      next => self.loadClassMethods(next),
      next => self.loadModels(next),
      next => self.loadResources(next),
      next => self.loadRoutes(next),
      function loaderHookExtensor (done) {
        we.hooks.trigger('plugin:load:features', {
          plugin: self, we: we
        }, done);
      },
    ], cb);
  }

  /**
   * Get generic featureFiles
   * Read feature dir, check if are an .js file and return full path and name of each file
   *
   * @param  {String}   fgPath feature path
   * @param  {Function} done   callback
   */

  Plugin.prototype.getGenericFeatureFiles = function getGenericFeatureFiles (fgPath, done) {
    fs.readdir(fgPath, (e, fileNames) => {
      if (e) {
        if (e.code !== 'ENOENT') return done(e)
        return done(null, [])
      }

      done(null, fileNames
      .filter(fileName => { return fileName.endsWith('.js') })
      .map(fileName => {
        return {
          name: fileName.slice(0, -3),
          path: path.join(fgPath, fileName)
        }
      }))
    })
  };

  /**
   * load plugin controllers
   */
  Plugin.prototype.loadControllers = function loadControllers (done) {
    this.getGenericFeatureFiles(this.controllersPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => {
        var attrs = require(m.path)
        attrs._controllersPath = this.controllersPath
        we.controllers[m.name] = new we.class.Controller(attrs)
      })

      done()
    })
  };

  /**
   * load plugin model hooks
   */
  Plugin.prototype.loadModelHooks = function loadModelHooks (done) {
     this.getGenericFeatureFiles(this.modelHooksPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => {
        we.db.modelHooks[m.name] = require(m.path).bind({ we: we })
      })

      done()
    })
  };

  /**
   * load plugin model instance methods
   */
  Plugin.prototype.loadInstanceMethods = function loadInstanceMethods (done) {
    this.getGenericFeatureFiles(this.modelInstanceMethodsPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => { we.db.modelInstanceMethods[m.name] = require(m.path) })

      done()
    })
  };

  /**
   * load plugin model class methods
   */
  Plugin.prototype.loadClassMethods = function loadClassMethods (done) {
    this.getGenericFeatureFiles(this.modelClassMethodsPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => { we.db.modelClassMethods[m.name] = require(m.path) })

      done()
    })
  };

  /**
   * load plugin search parsers
   */
  Plugin.prototype.loadSearchParsers = function loadSearchParsers (done) {
    this.getGenericFeatureFiles(this.searchParsersPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => {
        we.router.search.parsers[m.name] = require(m.path).bind({ we: we })
      })

      done()
    })
  };

  /**
   * load plugin search targets
   */
  Plugin.prototype.loadSearchTargets = function loadSearchTargets (done) {
    this.getGenericFeatureFiles(this.searchTargetsPath, (e, modules) => {
      if (e) return done(e)

      modules.forEach(m => {
        we.router.search.targets[m.name] = require(m.path).bind({ we: we })
      })

      done()
    })
  };

  /**
   * load plugin models with suport to JSON and .js file formats
   */
  Plugin.prototype.loadModels = function loadModels (done) {
    fs.readdir(this.modelsPath, (e, fileNames) => {
      if (e) {
        if (e.code !== 'ENOENT') return done(e)
        return done()
      }

      let name;

      fileNames.forEach(fileName => {
        if (fileName.endsWith('.js')) {
          // js model
          name = fileName.slice(0, -3)
          we.db.modelsConfigs[name] = require(path.join( this.modelsPath, fileName) )(we)
        } else if (fileName.endsWith('.json')) {
          // json model
          name = fileName.slice(0, -5)
          we.db.modelsConfigs[name] =
            we.db.defineModelFromJson( require(path.join(this.modelsPath, fileName)), we)
        }
      })

      done()
    })
  };

  /**
   * Load route resources from folder server/resources
   */
  Plugin.prototype.loadResources = function loadResources (cb) {
    fs.readdir(this.resourcesPath, (err, list) => {
      if (err) {
        if (err.code === 'ENOENT') return cb()
        return cb(err)
      }

      list
      .map(item => { return path.join(this.resourcesPath, item) })
      .forEach(p => { this.setResource( require(p) ) })

      cb()
    })
  }

  /**
   * Load routes from folder server/routes
   */
  Plugin.prototype.loadRoutes = function loadRoutes (cb) {
    fs.readdir(this.routesPath, (err, list) => {
      if (err) {
        if (err.code === 'ENOENT') return cb()
        return cb(err)
      }

      list
      .map(item => { return path.join(this.routesPath, item) })
      .forEach(p => { this.setRoutes( require(p) ) })

      cb()
    })
  }

  // -- Add css and js to we-plugin-view assets feature

  Plugin.prototype.addJs = function addJs (fileName, cfg) {
    this.assets.js[fileName] = cfg
  }

  Plugin.prototype.addCss = function addCss (fileName, cfg) {
    this.assets.css[fileName] = cfg
  }

  return Plugin
}