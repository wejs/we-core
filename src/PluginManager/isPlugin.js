import { resolve } from 'path'

/**
 * Helper to check if a npm module is a plugin
 * The logic is: is plugin if the npm module package.json have the wejs-plugin keyword
 *
 * @param  {String}  nodeModulePath
 * @return {Boolean}
 */
module.exports = function isPlugin (nodeModulePath) {
  let pkg = require( resolve(nodeModulePath, 'package.json') );

  if (pkg.keywords && pkg.keywords.includes('wejs-plugin') ) {
    return true
  } else {
    return false
  }
}