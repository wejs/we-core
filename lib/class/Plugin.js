  /**
   * We.js Plugin Class
   *
   *
   */
  var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    async = require('async');

module.exports = function (we) {
  /**
   * We.js plugin Class constructor
   *
   * @param {string} name   plugin npm pakage name
   * @param {string} projectPath project path where the plugin is instaled
   */
  function Plugin(pluginPath) {
    this.pluginPath = pluginPath;
    this.we = we;

    this.events = this.we.events;
    this.hooks = this.we.hooks;
    this.router = this.we.router;
    /**
     * Plugin Assets
     * @type {Object}
     */
    this.assets = {
      js: {},
      css: {}
    };

    this['package.json'] = require( path.join( pluginPath , 'package.json') );

    this.controllersPath = path.join( this.pluginPath,  this.controllerFolder );
    this.modelsPath = path.join( this.pluginPath,  this.modelFolder );
    this.modelHooksPath = path.join( this.pluginPath,  this.modelHookFolder );

    this.templatesPath = this.pluginPath + '/server/templates';
    this.helpersPath = this.pluginPath + '/server/helpers';
    this.resourcesPath = this.pluginPath + '/server/resources';
    this.routesPath = this.pluginPath + '/server/routes';

    this.helpers = {};
    this.layouts = {};
    this.templates = {};

    /**
     * Default plugin config object
     *
     * @type {Object}
     */
    this.configs = {};


    /**
     * Default plugin resources
     *
     * @type {Object}
     */
    this.controllers = {};
    this.models = {};
    this.routes = {};

    this.appFiles = [];
    this.appAdminFiles = [];
  }

  /**
   * Default initializer function, override in plugin.js file if need
   *
   * @param  {Object} we  we.js object
   * @param  {Function} cb callback
   */
  Plugin.prototype.init = function initPlugin(we, cb) { return cb(); }

  /**
   * Set plugin config
   * @param {Object} config
   */
  Plugin.prototype.setConfigs = function setConfigs(configs) {
    this.configs = configs;
  }

  // default plugin paths
  Plugin.prototype.controllerFolder = 'server/controllers';
  Plugin.prototype.modelFolder = 'server/models';
  Plugin.prototype.modelHookFolder = 'server/modelHooks';

  /**
   * Set plugin routes
   *
   * @param {object} routes
   */
  Plugin.prototype.setRoutes = function setRoutes(routes) {
    var routePaths = Object.keys(routes);
    var routePath;
    for (var i = routePaths.length - 1; i >= 0; i--) {
      routePath = routePaths[i];
      this.setRoute(routePath, routes[routePath]);
    }
  }

  /**
   * Set one route in plugin routes
   * @param {string} path    route path
   * @param {object} configs route configs how will be avaible as res.locals
   */
  Plugin.prototype.setRoute = function(routePath, configs) {
    this.routes[routePath] = configs;
    this.routes[routePath].path = routePath;
    this.routes[routePath].pluginPath = this.pluginPath;
  }

  Plugin.prototype.setResource = function(opts) {
    var router = this.we.router;

    var fullName = (opts.namePrefix || '') + opts.name;

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
        router.resourcesByName[opts.parent] = { subRoutes: {} };
        // add reference to route in parent subroutes
        router.resourcesByName[opts.parent].subRoutes[fullName] = router.resourcesByName[fullName];

      } else {
      // parent resource is set

        if (!router.resourcesByName[opts.parent].subRoutes) {
          // add subRoutes object if dont are set
          router.resourcesByName[opts.parent].subRoutes = {};
        }

        if (!router.resourcesByName[opts.parent].subRoutes[fullName]) {
          router.resourcesByName[opts.parent].subRoutes[fullName] = {};
        }
        // add reference to route in parent resource subroutes
        router.resourcesByName[opts.parent].subRoutes[fullName] = router.resourcesByName[fullName];
      }

    } else {
      // is route route
      router.resources[fullName] = router.resourcesByName[fullName];
    }
  }

  /**
   * Set plugin layouts
   * @param {object} layouts
   */
  Plugin.prototype.setLayouts = function setLayouts(layouts) {
    this.layouts = layouts;
  }

  /**
   * Load all we.js plugin features
   *
   * Auto load avaible for plugins, helpers ...
   *
   */
  Plugin.prototype.loadFeatures = function loadFeatures(we, cb) {
    var self = this;

    async.parallel([
      function loadControllesAndModels(done) {
        self.loadControllers(we);
        self.loadModelHooks(we);
        self.loadModels(we);
        done();
      },
      function loaderHookExtensor(done) {
        we.hooks.trigger('plugin:load:features', {
          plugin: self,
          we: we
        }, done);
      },
      // load resources then the routes
      function loadResources(done) {
        self.loadResources(function(){
          self.loadRoutes(done);
        });
      }
    ], cb);
  }
  /**
   * load plugin controllers
   */
  Plugin.prototype.loadControllers = function loadControllers(we) {
    var self = this;
    var name;
    try {
      fs.readdirSync(this.controllersPath)
      .forEach(function(fileName) {
        if (fileName.endsWith('.js')) {
          name = fileName.slice(0, -3);
          var attrs = require(path.join(self.controllersPath, fileName));

          attrs._controllersPath = self.controllersPath;

          we.controllers[name] =
            new we.class.Controller(attrs);
        }
      });
    } catch(e) {
      if (e.code !== 'ENOENT') throw e;
    }
  };
  /**
   * load plugin models
   */
  Plugin.prototype.loadModels = function loadModels(we) {
    var self = this;
    var name;
    try {
      fs.readdirSync(this.modelsPath)
      .forEach(function(fileName) {
        if (fileName.endsWith('.js')) {
          // js model
          name = fileName.slice(0, -3);

          we.db.modelsConfigs[name] =
            require(path.join(self.modelsPath, fileName))(we);
        } else if(fileName.endsWith('.json')){
          // json model
          name = fileName.slice(0, -5);//

          we.db.modelsConfigs[name] =
            we.db.defineModelFromJson( require(path.join(self.modelsPath, fileName)), we);
        }
      });
    } catch(e) {
      if (e.code !== 'ENOENT') throw e;
    }
  };

  /**
   * load plugin model hooks
   */
  Plugin.prototype.loadModelHooks = function loadModelHooks(we) {
    var self = this;
    var name;

    try {
      fs.readdirSync(this.modelHooksPath)
      .forEach(function (fileName) {

        if (fileName.endsWith('.js')) {
          name = fileName.slice(0, -3);

          we.db.modelHooks[name] =
            require(path.join(self.modelHooksPath, fileName))
            .bind({ we: we });
        }
      });
    } catch(e) {
      if (e.code !== 'ENOENT') throw e;
    }
  };

  /**
   * Load route resources from folder server/resources
   *
   * @param  {Function} cb callback
   */
  Plugin.prototype.loadResources = function loadResources(cb) {
    var self = this;

    fs.readdir(this.resourcesPath , function (err, list){
      if (err) {
        if (err.code === 'ENOENT') return cb();
        throw err;
      }
      for (var i = 0; i < list.length; i++) {
       self.setResource(require(self.resourcesPath+'/'+list[i]));
      }
      cb();
    });
  }
  /**
   * Load routes from folder server/routes
   *
   * @param  {Function} cb callback
   */
  Plugin.prototype.loadRoutes = function loadRoutes(cb) {
    var self = this;

    fs.readdir(this.routesPath , function (err, list) {
      if (err) {
        if (err.code === 'ENOENT') return cb();
        throw err;
      }
      for (var i = 0; i < list.length; i++) {
       self.setRoutes(require(self.routesPath+'/'+list[i]));
      }
      cb();
    });
  }

  // -- Add css and js to we-plugin-view assets feature

  Plugin.prototype.addJs = function addJs(fileName, cfg) {
    this.assets.js[fileName] = cfg;
  }

  Plugin.prototype.addCss = function addCss(fileName, cfg) {
    this.assets.css[fileName] = cfg;
  }

  return Plugin;
}