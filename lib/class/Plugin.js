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

  this.helpers = {};
  this.layouts = {};
  this.templates = {};
  this.widgets = {};
}


/**
 * Default initializer function, override in plugin.js file if need
 *
 * @param  {Object} we  we.js object
 * @param  {Function} cb callback
 */
Plugin.prototype.init = function initPlugin(we, cb) { return cb(); }

/**
 * Get we.js
 * @return {Object}
 */
Plugin.prototype.getWe = function getWe() {
  return require('../index.js');
}

/**
 * We.js Assets
 * @type {Object}
 */
Plugin.prototype.assets = assets;

Plugin.prototype.addJs = assets.addJs;
Plugin.prototype.addCss = assets.addCss;

/**
 * Default plugin config object
 *
 * @type {Object}
 */
Plugin.prototype.configs = {};

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
 * Default plugin resources
 *
 * @type {Object}
 */
Plugin.prototype.controllers = {};
Plugin.prototype.models = {};
Plugin.prototype.routes = {};

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
  var namePrefix = (opts.namePrefix || '');

  if (!router.resources[namePrefix + opts.name])
    router.resources[namePrefix + opts.name] = {};

  _.merge(router.resources[namePrefix + opts.name], opts);
}

/**
 * Set plugin helpers
 * @param {object} helpers
 */
Plugin.prototype.setHelpers = function setHelpers(helpers) {
  this.helpers = helpers;
}

/**
 * Set plugin layouts
 * @param {object} layouts
 */
Plugin.prototype.setLayouts = function setLayouts(layouts) {
  this.layouts = layouts;
}

/**
 * Set plugin templates
 * @param {object} templates
 */
Plugin.prototype.setTemplates = function setTemplates(templates) {
  this.templates = templates;
}

/**
 * Set plugin widgets
 * @param {object} widgets
 */
Plugin.prototype.setWidgets = function(widgets) {
  this.widgets = widgets;
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

Plugin.prototype.loadTemplates = function loadTemplates(cb) {
  var we = require('../index');
  var self = this, templateName;

  // load template folders
  we.utils.listFilesRecursive(this.templatesPath ,function(err, list){
    for (var i = 0; i < list.length; i++) {
      if (list[i].indexOf('.hbs', list[i].length - 4) >-1) {
        templateName = list[i].substring(0, list[i].length-4).substring(self.templatesPath.length+1);
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

Plugin.prototype.events = events;
Plugin.prototype.hooks = hooks;

Plugin.prototype.appFiles = [];
Plugin.prototype.appAdminFiles = [];


// export the class
module.exports = Plugin;