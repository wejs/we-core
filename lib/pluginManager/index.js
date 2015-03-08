var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var isPlugin = require('./isPlugin.js');
var Plugin = require('../class/Plugin.js');
var log = require('../log')();
var projectPath = process.cwd();

var pluginManager = {};

pluginManager.plugins = {};

pluginManager.isPlugin = require('./isPlugin.js');

pluginManager.pluginIsEnabled = require('./pluginIsEnabled.js');

pluginManager.getPluginNames = function getPluginNames() {
  return Object.keys( pluginManager.plugins );
}

pluginManager.loadPlugin = function loadPlugin(nodeModulesPath, npm_module_name, check) {
  pluginPath = path.resolve(nodeModulesPath, npm_module_name);
  // only load the plugin is valid and is enabled
  if (pluginManager.pluginIsEnabled(npm_module_name) && pluginManager.isPlugin(pluginPath) ) {
    // plugin file
    pluginFile = path.resolve( pluginPath, 'plugin.js' );
    // 
    pluginManager.plugins[npm_module_name] = require(pluginFile)( projectPath , Plugin);
  } else {
    log.silly('Invalid plugin:', npm_module_name, pluginPath);
  }
}

// preload the plugins
loadPlugins();

// exports pluginManager
module.exports = pluginManager;

//
// - private functions
//
 
/**
 * Load and register all avaible plugins
 * 
 * @param  {object}   we we.js object
 * @param  {Function} cb callback
 */
function loadPlugins() {
  if (! _.isEmpty(pluginManager.plugins) ) return pluginManager.plugins;

  var nodeModulesPath = path.resolve( projectPath, 'node_modules');

  var files = fs.readdirSync(nodeModulesPath);
  var npm_module_name, pluginPath, pluginFile;

  for (var i = files.length - 1; i >= 0; i--) {
    npm_module_name = files[i];
    pluginManager.loadPlugin(nodeModulesPath, npm_module_name);

  }

  return pluginManager.plugins;
};
