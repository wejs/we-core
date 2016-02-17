/**
 * We.js Plugin Class
 *
 *
 */
var _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  async = require('async'),
  requireAll = require('require-all'),
  hooks = require('../hooks'),
  assets = require('../view/assets'),
  router = require('../router'),
  events = require('../events');

/**
 * We.js plugin Class constructor
 *
 * @param {string} name   plugin npm pakage name
 * @param {string} projectPath project path where the plugin is instaled
 */
function Plugin(pluginPath) {
  this.pluginPath = pluginPath;

  this['package.json'] = require( path.join( pluginPath , 'package.json') );

  this.controllersPath = path.join( this.pluginPath,  this.controllerFolder );
  this.modelsPath = path.join( this.pluginPath,  this.modelFolder );

  this.templatesPath = this.pluginPath + '/server/templates';
  this.helpersPath = this.pluginPath + '/server/helpers';
  this.widgetsPath = this.pluginPath + '/server/widgets';
  this.resourcesPath = this.pluginPath + '/server/resources';
  this.routesPath = this.pluginPath + '/server/routes';

  this.helpers = {};
  this.layouts = {};
  this.templates = {};
  this.widgets = {};

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
 * We.js Assets
 * @type {Object}
 */
Plugin.prototype.assets = assets;

Plugin.prototype.addJs = assets.addJs;
Plugin.prototype.addCss = assets.addCss;

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
  var fullName = (opts.namePrefix || '') + opts.name;

  // first save in name
  if (!router.resourcesByName[fullName]) {
    router.resourcesByName[fullName] = opts;
  } else {
    _.merge(router.resourcesByName[fullName], opts);
  }

  if (opts.parent) {
  // is subroute

    if (!router.resourcesByName[opts.parent]) {
      router.resourcesByName[opts.parent] = { subRoutes: {} };
      router.resourcesByName[opts.parent].subRoutes[fullName] = opts;
    } else {
       if (!router.resourcesByName[opts.parent].subRoutes)
        router.resourcesByName[opts.parent].subRoutes = {};

    if (!router.resourcesByName[opts.parent].subRoutes[fullName])
      router.resourcesByName[opts.parent].subRoutes[fullName] = {};
      _.merge(router.resourcesByName[opts.parent].subRoutes[fullName], opts);
    }

  } else {
  // is route route

    router.resources[fullName] = router.resourcesByName[fullName];
  }
}

/**
 * Set plugin helpers DEPRECATED!
 * Now this feature have a auto load!
 * @param {object} helpers
 */
Plugin.prototype.setHelpers = function setHelpers() {
  var we = require('../index.js');
  we.log.warn('DEPRECATED! Plugin.setHelpers in plugin: ', this.pluginPath);
}

/**
 * Set plugin layouts
 * @param {object} layouts
 */
Plugin.prototype.setLayouts = function setLayouts(layouts) {
  this.layouts = layouts;
}

/**
 * Set plugin templates DEPRECATED!
 * Now this feature have a auto load!
 * @param {object} templates
 */
Plugin.prototype.setTemplates = function setTemplates() {
  var we = require('../index.js');
  we.log.warn('DEPRECATED! Plugin.setTemplates in plugin: ', this.pluginPath);
}

/**
 * Set plugin widgets DEPRECATED!
 * Now this feature have a auto load!
 * @param {object} widgets
 */
Plugin.prototype.setWidgets = function() {
  var we = require('../index.js');
  we.log.warn('DEPRECATED! Plugin.setWidgets in plugin: ', this.pluginPath);
}

/**
 * Load all we.js plugin features
 *
 * Auto load avaible for plugins, helpers and widgets
 *
 */
Plugin.prototype.loadFeatures = function loadFeatures(we, cb) {
  var self = this;

  async.parallel([
    function loadControllesAndModels(done) {
      self.loadControllers(we);
      self.loadModels(we);
      done();
    },
    function loadPluginTemplates (done) {
      self.loadTemplates(done);
    },
    function loadHelpers(done) {
      self.loadHelpers(done);
    },
    function loadWidgets(done) {
      self.loadWidgets(done);
    },
    // load resources then the routes
    function loadResources(done) {
      self.loadResources(function(){
        self.loadRoutes(done);
      });
    }
  ], function (err){
    if (err) return cb(err);

    if (self.layouts) _.merge(we.view.configuration.layouts, self.layouts);

    cb();
  });
}
/**
 * load plugin controllers
 */
Plugin.prototype.loadControllers = function loadControllers() {
  try {
    this.controllers = requireAll({
      dirname     :  this.controllersPath,
      filter      :  /(.+)\.js$/
    });
  } catch(e) {
    if (e.code !== 'ENOENT') throw e;
  }
};
/**
 * load plugin models
 */
Plugin.prototype.loadModels = function loadModels(we) {
  try {
    this.models = requireAll({
      dirname     :  this.modelsPath,
      filter      :  /(.+)\.js$/,
      resolve     : function (model) {
        return model(we);
      }
    });
  } catch(e) {
    if (e.code !== 'ENOENT') throw e;
  }
};

/**
 * Load templates used in we.js bootstrap
 */
Plugin.prototype.loadTemplates = function loadTemplates (cb) {
  var we = require('../index');
  var self = this, templateName;

  // load template folders
  we.utils.listFilesRecursive(this.templatesPath, function (err, list){

    for (var i = 0; i < list.length; i++) {
      if (list[i].indexOf('.hbs', list[i].length - 4) >-1) {
        templateName = list[i].substring(0, list[i].length-4).substring(self.templatesPath.length+1);
        // ensures that template names always have / slashes
        if (path.sep != '/') templateName = templateName.split(path.sep).join('/');

        self.templates[templateName] = list[i];
        we.view.configuration.templates[templateName] = list[i];
      }
    }
    cb();
  });
}

/**
 * Load helpers from folder server/helpers
 *
 * @param  {Object}   we
 * @param  {Function} cb callback
 */
Plugin.prototype.loadHelpers = function loadHelpers(cb) {
  var we = require('../index');
  var self = this, name, file;

  fs.readdir(this.helpersPath , function (err, list){
    if (err) {
      if (err.code === 'ENOENT') return cb();
      return cb(err);
    }

    for (var i = 0; i < list.length; i++) {
      if (list[i].indexOf('.js', list[i].length - 3) >-1) {

        name = list[i].substring(0, list[i].length-3);
        file = self.helpersPath +'/'+list[i];

        self.helpers[name] = file;
        we.view.configuration.helpers[name] = file;
      }
    }
    cb();
  });
}

/**
 * Load widgets from folder server/widgets
 *
 * @param  {Object}   we
 * @param  {Function} cb callback
 */
Plugin.prototype.loadWidgets = function loadWidgets(cb) {
  var we = require('../index');
  var self = this, name, file;

  fs.readdir(this.widgetsPath , function (err, list){
    if (err) {
      if (err.code === 'ENOENT') return cb();
      return cb(err);
    }

    for (var i = 0; i < list.length; i++) {
      name = list[i];
      file = self.widgetsPath +'/'+name;

      self.helpers[name] = file;
      we.view.configuration.widgets[name] = file;
    }
    cb();
  });
}

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

Plugin.prototype.events = events;
Plugin.prototype.hooks = hooks;
Plugin.prototype.router = router;

// export the class
module.exports = Plugin;
