var pluginConfigs = require('./loadPluginConfig.js')();

/**
 * Check if a plugin is enabled
 * 
 * @param  {object} we              we.js object
 * @param  {string} npm_module_name 
 * @return {boolean}                 
 */
module.exports = function pluginIsEnabled(npm_module_name) {
  if (pluginConfigs.enableAll) return true;
  if (pluginConfigs.indexOf(npm_module_name) > 0 ) return true;
  return false;
}
