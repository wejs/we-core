var pluginConfigs = require('../staticConfig')().plugins;

/**
 * Check if a plugin is enabled
 *
 * @param  {object} we              we.js object
 * @param  {string} npmModuleName
 * @return {boolean}
 */
module.exports = function pluginIsEnabled(npmModuleName) {
  if (pluginConfigs.enableAll) return true;
  if (pluginConfigs.enabled.indexOf(npmModuleName) > 0 ) return true;
  return false;
}
