var _ = require('lodash');
var path = require ('path');

var configCache = null;

/**
 * Load project theme configs
 *
 * @param  {String} projectPath
 * @return {object}    project plugin configs
 */
module.exports = function loadThemeConfig(projectPath) {
  if (! _.isEmpty(configCache) ) return configCache;
  if (!projectPath) projectPath = process.cwd();

  var config = {
    enabled: {},
    app: 'we-theme-site-wejs',
    admin: 'we-theme-admin-default'
  };

  var p =  path.resolve( projectPath, 'config', 'themes.js' );

  // try to load database configs from project database config
  try {
    config = require(p).themes;
  } catch(e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load theme configs:', e);
    }
  }

  configCache = config;

  return config;
}