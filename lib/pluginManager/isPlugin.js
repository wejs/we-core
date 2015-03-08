var fs = require('fs');
var path = require('path');

/**
 * Helper to check if a npm module is a plugin
 * 
 * @param  {string}  node_module_path 
 * @return {Boolean}                  
 */
module.exports = function isPlugin(node_module_path) {
  if (fs.statSync( node_module_path ).isDirectory() ) {
    if ( fs.existsSync( path.resolve( node_module_path, 'plugin.js' ) ) ) {
      return true;  
    }
  }
  return false;
}