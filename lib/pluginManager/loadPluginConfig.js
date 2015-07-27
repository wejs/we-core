var _ = require('lodash');
var path = require ('path');

var configCache = null;

/**
 * Load project plugin configs to check how plugin will be load
 *
 * @param  {object} we [description]
 * @return {object}    project plugin configs
 */
module.exports = function loadPluginConfig(projectPath) {
  if (configCache) return configCache;
  if (!projectPath) projectPath = process.cwd();
  var pluginFileConfigs;

  var config = {
    // if set enableAll to true we.js ignore the enabled config and will load all plugins on npm_module folder
    enableAll: true,
    enabled: []
  };

  // try to load database configs from project database config
  try {
    pluginFileConfigs = require( path.resolve( projectPath, 'config', 'plugins.js' ));
    _.merge(config, pluginFileConfigs.plugins);
    // prepend we-core if not set
    if (config.enabled.indexOf('we-core') == -1)
      config.enabled.unshift('we-core');
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load plugin configs:', e);
    }
    // project plugin config file not found
  }

  configCache = config;

  return config;
}