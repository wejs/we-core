var fs = require('fs');
var path = require('path');

/**
 * Helper to check if a npm module is a plugin
 *
 * @param  {string}  nodeModulePath
 * @return {Boolean}
 */
module.exports = function isPlugin(nodeModulePath) {
  if (fs.statSync( nodeModulePath ).isDirectory() ) {
    if ( fs.existsSync( path.resolve( nodeModulePath, 'plugin.js' ) ) ) {
      return true;
    }
  }
  return false;
}