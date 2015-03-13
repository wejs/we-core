/**
 * We.js Plugin Class
 *
 *
 */
var _ = require('lodash'),
  path = require('path'),
  requireAll = require('require-all'),
  hooks = require('../hooks'),
  events = require('../events'),
  sanitizer = require('../sanitizer'),
  db = require('../database');

/**
 * We.js plugin Class constructor
 *
 * @param {string} name   plugin npm pakage name
 * @param {string} projectPath project path where the plugin is instaled
 * @param {object} options extra options
 */
function Plugin(pluginPath, options) {
  this.pluginPath = pluginPath;

  this['package.json'] = require( path.join( pluginPath , 'package.json') );

  this.controllersPath = path.join( this.pluginPath,  this.controllerFolder );
  this.modelsPath = path.join( this.pluginPath,  this.modelFolder );

}


/**
 * Default initializer function, override in plugin.js file if need
 * 
 * @param  {Object} we  we.js object
 * @param  {Function} cb callback 
 */
Plugin.prototype.init = function initPlugin(we, cb) { return cb(); }

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
  };
}

/**
 * Set one route in plugin routes
 * @param {string} path    route path
 * @param {object} configs route configs how will be avaible as req.context
 */
Plugin.prototype.setRoute = function(routePath, configs) {
  this.routes[routePath] = configs;
  this.routes[routePath].path = routePath;
  this.routes[routePath].pluginPath = this.pluginPath;
}

/**
 * Load all we.js plugin features
 */
Plugin.prototype.loadFeatures = function loadFeatures() {
  this.loadControllers();
  this.loadModels();
}
/**
 * load plugin controllers
 */
Plugin.prototype.loadControllers = function loadControllers() {
  this.controllers = requireAll({
    dirname     :  this.controllersPath,
    filter      :  /(.+)\.js$/
  });
};
/**
 * load plugin models
 */
Plugin.prototype.loadModels = function loadModels() {
  this.models = requireAll({
    dirname     :  this.modelsPath,
    filter      :  /(.+)\.js$/,
    resolve     : function (Model) {
      return Model(db, hooks, events, sanitizer);
    }
  });
};

Plugin.prototype.events = events;
Plugin.prototype.hooks = hooks;

Plugin.prototype.appFiles = [];
Plugin.prototype.appAdminFiles = [];


// export the class
module.exports = Plugin;