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

pluginManager.loadPlugin = function loadPlugin(pluginFile, npm_module_name, projectPath) {
  pluginManager.plugins[npm_module_name] = require(pluginFile)( projectPath , Plugin);
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

  // plugins from node_modules
  var nodeModulesPath = path.resolve( projectPath, 'node_modules');

  var files = fs.readdirSync(nodeModulesPath);
  var npm_module_name, pluginPath, pluginFile;

  for (var i = files.length - 1; i >= 0; i--) {
    npm_module_name = files[i];
    pluginPath = path.resolve(nodeModulesPath, npm_module_name);
    // only load the plugin is valid and is enabled
    if (pluginManager.pluginIsEnabled(npm_module_name) && pluginManager.isPlugin(pluginPath) ) {
      pluginFile = path.resolve( pluginPath, 'plugin.js' );
      // load plugin    
      pluginManager.loadPlugin(pluginFile, npm_module_name, projectPath);
    }
  }

  // load project plugin.js file if exists
  try {
    pluginFile = path.join( projectPath, 'plugin.js' );
    pluginManager.loadPlugin(pluginFile, 'project', projectPath);
  } catch (e) {
    console.error('Error on load project plugin file:', e);
  }

  return pluginManager.plugins;
};
