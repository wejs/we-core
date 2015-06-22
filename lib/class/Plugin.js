/**
 * We.js Plugin Class
 *
 *
 */
var _ = require('lodash'),
  path = require('path'),
  requireAll = require('require-all'),
  hooks = require('../hooks'),
  assets = require('../view/assets'),
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
  _.merge(this.configs, configs);
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
 */
Plugin.prototype.loadFeatures = function loadFeatures(we) {
  this.loadControllers(we);
  this.loadModels(we);

  if (this.layouts) _.merge(we.view.configuration.layouts, this.layouts);
  if (this.templates) _.merge(we.view.configuration.templates, this.templates);
  if (this.helpers) _.merge(we.view.configuration.helpers, this.helpers);
  if (this.widgets) _.merge(we.view.configuration.widgets, this.widgets);
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

Plugin.prototype.events = events;
Plugin.prototype.hooks = hooks;

Plugin.prototype.appFiles = [];
Plugin.prototype.appAdminFiles = [];


// export the class
module.exports = Plugin;