/**
 * Static configs loader
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var log = require('../log')();

/**
 * Config cache
 * @type {Object}
 */
var configs = {
  plugin: {
    // if set enableAll to true we.js ignore the enabled config and will load all plugins on npm_module folder
    enableAll: false,
    enabled: []
  }
};

var configsIsLoad = false;

/**
 * Get project static configs
 *
 * @param  {String} projectPath project path ( opcional )
 * @return {Object}             configs
 */
var init = function init(projectPath) {
  // return configs if is load
  if (configsIsLoad) return configs;
  // - load and merge project configs
  if (!projectPath) projectPath = process.cwd();

  var projectConfigFolder = path.resolve( projectPath, 'config' );

  var files = [];

  try {
    files = fs.readdirSync(projectConfigFolder);
  } catch(e) {
    if (e.code != 'ENOENT') log.error('Error on load project config folder: ', e);
  }

  var file;
  for (var i = 0; i < files.length; i++) {
    if (files[i] == 'local.js') continue;
    file = path.resolve(projectConfigFolder, files[i]);
    // skip dirs
    if (fs.lstatSync(file).isDirectory()) continue;
    _.merge(configs, require(file));
  }

  var localConfigFile;

  try {
    // load local.js after others configs
    localConfigFile = require( path.resolve(projectConfigFolder, 'local.js') );
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load local.js config:', e);
    }
    localConfigFile = {};
  }

  // load project local config file
  _.merge(configs, localConfigFile);

  configsIsLoad = true;

  return configs;
};


var pluginConfigsIsLoad = false;
init.loadPluginConfigs = function() {
  if (pluginConfigsIsLoad) return configs;

  var pluginManager = require('../pluginManager');

  var pluginConfigs = {};

  // - load and merge plugin configs
  for (var pluginName in pluginManager.plugins) {
    _.merge(pluginConfigs, pluginManager.plugins[pluginName].configs);
  }
  // load project local config file
  configs = _.merge(pluginConfigs, configs);

  pluginConfigsIsLoad = true;
  return configs;
}

module.exports = init;
