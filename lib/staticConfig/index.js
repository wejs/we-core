'use strict';

/**
 * Static configs loader
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

/**
 * Get project static configs
 *
 * @param  {String} projectPath project path ( opcional )
 * @return {Object}             configs
 */
function staticConfig(projectPath, app) {
  if (!projectPath) throw new Error('project path is required for load static configs');

  // return configs if already is loaded
  if (app.staticConfigsIsLoad) return app.config;

  // - load and merge project configs

  var projectConfigFolder = app.projectConfigFolder;

  var files = [];

  try {
    files = fs.readdirSync(projectConfigFolder);
  } catch (e) {
    if (e.code != 'ENOENT') console.error('Error on load project config folder: ', e);
  }

  var file = void 0;
  for (var i = 0; i < files.length; i++) {
    if (files[i] == 'local.js') continue; // skip locals.js to load after all
    if (!files[i].endsWith('.js')) continue; // only accepts .js config files

    file = path.resolve(projectConfigFolder, files[i]);
    // skip dirs
    if (fs.lstatSync(file).isDirectory()) continue;
    _.merge(app.config, require(file));
  }

  var jsonConfiguration = staticConfig.readJsonConfiguration(projectConfigFolder);
  var localConfigFile = staticConfig.readLocalConfigFile(projectConfigFolder);

  // load project local config file
  _.merge(app.config, jsonConfiguration, localConfigFile);

  app.staticConfigsIsLoad = true;

  return app.config;
}

/**
 * Read the config/locals.js configuration file
 */
staticConfig.readLocalConfigFile = function (projectConfigFolder) {
  try {
    // load local.js after others configs
    return require(path.resolve(projectConfigFolder, 'local.js'));
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      console.error('Unknow error on load local.js config:', e);
    }
    return {};
  }
};

/**
 * Read JSON Configuration file and create it if not exists
 */
staticConfig.readJsonConfiguration = function (projectConfigFolder) {
  var dirCFJSON = path.resolve(projectConfigFolder, 'configuration.json');

  try {
    // load configuration.json after others but before local.js
    return JSON.parse(fs.readFileSync(dirCFJSON));
  } catch (e) {
    if (e.code != 'ENOENT') {
      console.error('Unknow error on load config/configuration.json config:', e);
    } else {
      // if not exists create it
      fs.writeFileSync(dirCFJSON, '{}');
      console.log('The file configuration.json was created');
    }
    return {};
  }
};

staticConfig.loadPluginConfigs = function (we) {
  if (we.pluginConfigsIsLoad) return we.config;

  var pluginManager = we.pluginManager;

  var pluginConfigs = {};

  // - load and merge plugin configs
  for (var pluginName in pluginManager.plugins) {
    _.merge(pluginConfigs, pluginManager.plugins[pluginName].configs);
  }
  // load project local config file
  we.config = _.merge(pluginConfigs, we.config);

  we.pluginConfigsIsLoad = true;

  return we.config;
};

module.exports = staticConfig;