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
    // current theme
    configs.theme = this.theme;
    // get delete widget msg
    configs.structure.deleteWidgetConfirm = this.__('widget.delete.confirm.msg');

    configs.modelName = this.model;
    configs.modelId = this.id;
    // event to allow changes in configs from others plugins
    we.events.emit('we:config:getAppBootstrapConfig', {
      configs: configs,
      we: we,
      context: this
    });

    var tags = '<script type="text/javascript"> window.WE_BOOTSTRAP_CONFIG=';
    tags += JSON.stringify(configs);
    tags += '</script>';
    return tags;
  }
}