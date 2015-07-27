var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Plugin = require('../class/Plugin.js');
var projectPath = process.cwd();
// plugins from node_modules
var nodeModulesPath = path.resolve(projectPath, 'node_modules');

var pluginManager = {};
pluginManager.configs = require('./loadPluginConfig')(projectPath);
pluginManager.plugins = {};
pluginManager.isPlugin = require('./isPlugin.js');
pluginManager.pluginIsEnabled = require('./pluginIsEnabled.js');
pluginManager.getPluginNames = function getPluginNames() {
  return Object.keys( pluginManager.plugins );
}

pluginManager.loadPlugin = function loadPlugin(pluginFile, npmModuleName, projectPath) {
  pluginManager.plugins[npmModuleName] = require(pluginFile)( projectPath , Plugin);
}

// preload all plugins
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
  // only load one time
  if (! _.isEmpty(pluginManager.plugins) ) return pluginManager.plugins;

  if (!pluginManager.configs.enableAll) return loadOnlyEnabledPlugins();

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

  loadProjectAsPlugin();

  return pluginManager.plugins;
}

/**
 * Load plugins with config/plugins.js file from projet folder
 * @return {Object} pluginManager.plugins
 */
function loadOnlyEnabledPlugins() {
  var pluginNames = pluginManager.configs.enabled;
  var pluginFile;
  for (var i = 0; i < pluginNames.length; i++) {
    pluginFile = path.resolve(nodeModulesPath, pluginNames[i], 'plugin.js');
    // load plugin
    pluginManager.loadPlugin(pluginFile, pluginNames[i], projectPath);
  }

  loadProjectAsPlugin();
  return pluginManager.plugins;
}

/**
 * Check is project have a plugin.js file and if yes load it as plugin
 */
function loadProjectAsPlugin() {
    // load project plugin.js file if exists
  try {
    var pluginFile = path.join( projectPath, 'plugin.js' );
    pluginManager.loadPlugin(pluginFile, 'project', projectPath);
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      throw e;
    }
  }
}