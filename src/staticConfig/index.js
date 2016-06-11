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
var staticConfig = function init(projectPath, app) {
  if (!projectPath) throw new Error('project path is required for load static configs');

  // return configs if already is loaded
  if (app.staticConfigsIsLoad) return app.config;

  // - load and merge project configs

  var projectConfigFolder = app.projectConfigFolder;

  var files = [];

  try {
    files = fs.readdirSync(projectConfigFolder);
  } catch(e) {
    if (e.code != 'ENOENT') console.error('Error on load project config folder: ', e);
  }

  var file;
  for (var i = 0; i < files.length; i++) {
    if (files[i] == 'local.js') continue; // skip to load after all
    if (!files[i].endsWith('.js')) continue; // only accepts .js config files

    file = path.resolve(projectConfigFolder, files[i]);
    // skip dirs
    if (fs.lstatSync(file).isDirectory()) continue;
    _.merge(app.config, require(file));
  }

  var jsonConfiguration, localConfigFile;
  var dirCFJSON = path.resolve(projectConfigFolder, 'configuration.json');

  try {
    // load configuration.json after others but before local.js
    jsonConfiguration = require(dirCFJSON);
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load config/configuration.json config:', e);
    } else {
      // if not exists create it
      fs.writeFile(dirCFJSON, '{}', function (err) {
        if (err) {
          console.log('Error on create configuration.json',err);
        } else {
          console.log('The file configuration.json was created!');
        }
      });
    }
    jsonConfiguration = {};
  }

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
  _.merge(app.config, jsonConfiguration, localConfigFile);

  app.staticConfigsIsLoad = true;

  return app.config;
};

staticConfig.loadPluginConfigs = function(we) {
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
}

module.exports = staticConfig;
