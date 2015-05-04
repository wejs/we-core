var pluginConfigs = require('./loadPluginConfig.js')();

/**
 * Check if a plugin is enabled
 *
 * @param  {object} we              we.js object
 * @param  {string} npmModuleName
 * @return {boolean}
 */
module.exports = function pluginIsEnabled(npmModuleName) {
  if (pluginConfigs.enableAll) return true;
  if (pluginConfigs.indexOf(npmModuleName) > 0 ) return true;
  return false;
}
