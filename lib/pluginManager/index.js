var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Plugin = require('../class/Plugin.js');
var projectPath = process.cwd();

var pluginManager = {};

pluginManager.plugins = {};

pluginManager.isPlugin = require('./isPlugin.js');

pluginManager.pluginIsEnabled = require('./pluginIsEnabled.js');

pluginManager.getPluginNames = function getPluginNames() {
  return Object.keys( pluginManager.plugins );
}

pluginManager.loadPlugin = function loadPlugin(pluginFile, npmModuleName, projectPath) {
  pluginManager.plugins[npmModuleName] = require(pluginFile)( projectPath , Plugin);
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
  var npmModuleName, pluginPath, pluginFile;

  for (var i = 0; i < files.length; i++) {
    npmModuleName = files[i];
    pluginPath = path.resolve(nodeModulesPath, npmModuleName);
    // only load the plugin is valid and is enabled
    if (pluginManager.pluginIsEnabled(npmModuleName) && pluginManager.isPlugin(pluginPath) ) {
      pluginFile = path.resolve( pluginPath, 'plugin.js' );
      // load plugin
      pluginManager.loadPlugin(pluginFile, npmModuleName, projectPath);
    }
  }

  // load project plugin.js file if exists
  try {
    pluginFile = path.join( projectPath, 'plugin.js' );
    pluginManager.loadPlugin(pluginFile, 'project', projectPath);
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      throw e;
    }
  }

  return pluginManager.plugins;
}