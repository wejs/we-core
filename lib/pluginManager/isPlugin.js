var fs = require('fs');
var path = require('path');

/**
 * Helper to check if a npm module is a plugin
 *
 * @param  {string}  nodeModulePath
 * @return {Boolean}
 */
module.exports = function isPlugin(nodeModulePath) {
  try {
    if (fs.statSync( path.resolve( nodeModulePath, 'plugin.js' ) )) {
      return true;
    } else {
      return false;
    }
  } catch(e) {
    return false;
  }
}