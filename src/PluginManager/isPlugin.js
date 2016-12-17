const { resolve } = require('path');

/**
 * Helper to check if a npm module is a plugin
 * The logic is: is plugin if the npm module package.json have the wejs-plugin keyword
 *
 * @param  {String}  nodeModulePath
 * @return {Boolean}
 */
module.exports = function isPlugin (nodeModulePath) {
  let pkg;
  try {
    pkg = require( resolve(nodeModulePath, 'package.json') );
  } catch(e) {
    return false;
  }

  if (pkg.keywords && pkg.keywords.includes('wejs-plugin') ) {
    return true;
  } else {
    return false;
  }
};