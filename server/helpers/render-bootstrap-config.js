/**
 * Print we.js client side core configs
 *
 * usage: {{{render-bootstrap-config}}}
 *
 */

var getAppBootstrapConfig = require('../../lib/staticConfig/getAppBootstrapConfig.js');

module.exports = function(we) {
  return function renderBootstrapConfig() {
    var configs = getAppBootstrapConfig(we);
    // set current request locale
    configs.locale = this.locale;

    var tags = '<script type="text/javascript"> window.WE_BOOTSTRAP_CONFIG=';
    tags += JSON.stringify(configs);
    tags += '</script>';
    return tags;
  }
}