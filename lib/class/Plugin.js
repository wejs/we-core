'use strict';

/**
 * We.js Plugin prototype file
 */

var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    async = require('async');

module.exports = function getPluginPrototype(we) {
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

    this['package.json'] = require(path.join(pluginPath, 'package.json'));

    this.controllersPath = path.join(this.pluginPath, this.controllerFolder);
    this.modelsPath = path.join(this.pluginPath, this.modelFolder);
    this.modelHooksPath = path.join(this.pluginPath, this.modelHookFolder);
    this.modelInstanceMethodsPath = path.join(this.pluginPath, this.modelInstanceMethodFolder);
    this.modelClassMethodsPath = path.join(this.pluginPath, this.modelClassMethodFolder);

    this.searchParsersPath = path.join(this.pluginPath, this.searchParsersFolder);
    this.searchTargetsPath = path.join(this.pluginPath, this.searchTargetsFolder);

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
  Plugin.prototype.init = function initPlugin(we, cb) {
    return cb();
  };

  /**
   * Set plugin config
   * @param {Object} config
   */
  Plugin.prototype.setConfigs = function setConfigs(configs) {
    this.configs = configs;
  };

  // default plugin paths
  Plugin.prototype.controllerFolder = 'server/controllers';
  Plugin.prototype.modelFolder = 'server/models';
  Plugin.prototype.modelHookFolder = 'server/models/hooks';
  Plugin.prototype.modelInstanceMethodFolder = 'server/models/instanceMethods';
  Plugin.prototype.modelClassMethodFolder = 'server/models/classMethods';
  Plugin.prototype.searchParsersFolder = 'server/search/parsers';
  Plugin.prototype.searchTargetsFolder = 'server/search/targets';

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
  };

  /**
   * Set one route in plugin routes
   * @param {string} path    route path
   * @param {object} configs route configs how will be avaible as res.locals
   */
  Plugin.prototype.setRoute = function setRoute(routePath, configs) {
    this.routes[routePath] = configs;
    this.routes[routePath].path = routePath;
    this.routes[routePath].pluginPath = this.pluginPath;
  };

  Plugin.prototype.setResource = function setResource(opts) {
    var router = this.we.router,
        fullName = (opts.namePrefix || '') + opts.name;

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
  };

  /**
   * Set plugin layouts
   * @param {object} layouts
   */
  Plugin.prototype.setLayouts = function setLayouts(layouts) {
    this.layouts = layouts;
  };

  /**
   * Load all we.js plugin features
   *
   * Auto load avaible for plugins, helpers ...
   *
   */
  Plugin.prototype.loadFeatures = function loadFeatures(we, cb) {
    var self = this;

    async.parallel([function (next) {
      return self.loadSearchParsers(next);
    }, function (next) {
      return self.loadSearchTargets(next);
    }, function (next) {
      return self.loadControllers(next);
    }, function (next) {
      return self.loadModelHooks(next);
    }, function (next) {
      return self.loadInstanceMethods(next);
    }, function (next) {
      return self.loadClassMethods(next);
    }, function (next) {
      return self.loadModels(next);
    }, function (next) {
      return self.loadResources(next);
    }, function (next) {
      return self.loadRoutes(next);
    }, function loaderHookExtensor(done) {
      we.hooks.trigger('plugin:load:features', {
        plugin: self, we: we
      }, done);
    }], cb);
  };

  /**
   * Get generic featureFiles
   * Read feature dir, check if are an .js file and return full path and name of each file
   *
   * @param  {String}   fgPath feature path
   * @param  {Function} done   callback
   */

  Plugin.prototype.getGenericFeatureFiles = function getGenericFeatureFiles(fgPath, done) {
    fs.readdir(fgPath, function (e, fileNames) {
      if (e) {
        if (e.code !== 'ENOENT') return done(e);
        return done(null, []);
      }

      done(null, fileNames.filter(function (fileName) {
        return fileName.endsWith('.js');
      }).map(function (fileName) {
        return {
          name: fileName.slice(0, -3),
          path: path.join(fgPath, fileName)
        };
      }));
    });
  };

  /**
   * load plugin controllers
   */
  Plugin.prototype.loadControllers = function loadControllers(done) {
    var _this = this;

    this.getGenericFeatureFiles(this.controllersPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        var attrs = require(m.path);
        attrs._controllersPath = _this.controllersPath;
        we.controllers[m.name] = new we.class.Controller(attrs);
      });

      done();
    });
  };

  /**
   * load plugin model hooks
   */
  Plugin.prototype.loadModelHooks = function loadModelHooks(done) {
    this.getGenericFeatureFiles(this.modelHooksPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        we.db.modelHooks[m.name] = require(m.path).bind({ we: we });
      });

      done();
    });
  };

  /**
   * load plugin model instance methods
   */
  Plugin.prototype.loadInstanceMethods = function loadInstanceMethods(done) {
    this.getGenericFeatureFiles(this.modelInstanceMethodsPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        we.db.modelInstanceMethods[m.name] = require(m.path);
      });

      done();
    });
  };

  /**
   * load plugin model class methods
   */
  Plugin.prototype.loadClassMethods = function loadClassMethods(done) {
    this.getGenericFeatureFiles(this.modelClassMethodsPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        we.db.modelClassMethods[m.name] = require(m.path);
      });

      done();
    });
  };

  /**
   * load plugin search parsers
   */
  Plugin.prototype.loadSearchParsers = function loadSearchParsers(done) {
    this.getGenericFeatureFiles(this.searchParsersPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        we.router.search.parsers[m.name] = require(m.path).bind({ we: we });
      });

      done();
    });
  };

  /**
   * load plugin search targets
   */
  Plugin.prototype.loadSearchTargets = function loadSearchTargets(done) {
    this.getGenericFeatureFiles(this.searchTargetsPath, function (e, modules) {
      if (e) return done(e);

      modules.forEach(function (m) {
        we.router.search.targets[m.name] = require(m.path).bind({ we: we });
      });

      done();
    });
  };

  /**
   * load plugin models with suport to JSON and .js file formats
   */
  Plugin.prototype.loadModels = function loadModels(done) {
    var _this2 = this;

    fs.readdir(this.modelsPath, function (e, fileNames) {
      if (e) {
        if (e.code !== 'ENOENT') return done(e);
        return done();
      }

      var name = void 0;

      fileNames.forEach(function (fileName) {
        if (fileName.endsWith('.js')) {
          // js model
          name = fileName.slice(0, -3);
          we.db.modelsConfigs[name] = require(path.join(_this2.modelsPath, fileName))(we);
        } else if (fileName.endsWith('.json')) {
          // json model
          name = fileName.slice(0, -5);
          we.db.modelsConfigs[name] = we.db.defineModelFromJson(require(path.join(_this2.modelsPath, fileName)), we);
        }
      });

      done();
    });
  };

  /**
   * Load route resources from folder server/resources
   */
  Plugin.prototype.loadResources = function loadResources(cb) {
    var _this3 = this;

    fs.readdir(this.resourcesPath, function (err, list) {
      if (err) {
        if (err.code === 'ENOENT') return cb();
        return cb(err);
      }

      list.map(function (item) {
        return path.join(_this3.resourcesPath, item);
      }).forEach(function (p) {
        _this3.setResource(require(p));
      });

      cb();
    });
  };

  /**
   * Load routes from folder server/routes
   */
  Plugin.prototype.loadRoutes = function loadRoutes(cb) {
    var _this4 = this;

    fs.readdir(this.routesPath, function (err, list) {
      if (err) {
        if (err.code === 'ENOENT') return cb();
        return cb(err);
      }

      list.map(function (item) {
        return path.join(_this4.routesPath, item);
      }).forEach(function (p) {
        _this4.setRoutes(require(p));
      });

      cb();
    });
  };

  // -- Add css and js to we-plugin-view assets feature

  Plugin.prototype.addJs = function addJs(fileName, cfg) {
    this.assets.js[fileName] = cfg;
  };

  Plugin.prototype.addCss = function addCss(fileName, cfg) {
    this.assets.css[fileName] = cfg;
  };

  return Plugin;
};