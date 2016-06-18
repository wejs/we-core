'use strict';

var _path = require('path');

/**
 * Helper to check if a npm module is a plugin
 * The logic is: is plugin if the npm module package.json have the wejs-plugin keyword
 *
 * @param  {String}  nodeModulePath
 * @return {Boolean}
 */
module.exports = function isPlugin(nodeModulePath) {
  var pkg = require((0, _path.resolve)(nodeModulePath, 'package.json'));

  if (pkg.keywords && pkg.keywords.indexOf('wejs-plugin') !== -1) {
    return true;
  } else {
    return false;
  }
};