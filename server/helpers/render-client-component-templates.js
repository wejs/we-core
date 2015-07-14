/**
 * Print we.js client side core configs
 *
 * usage: {{{render-client-component-templates}}}
 *
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function renderClientComponentTemplates() {
    var html = '<div class="we-components-area">';

    for (var t in we.config.clientComponentTemplates) {
      if (!we.config.clientComponentTemplates[t]) continue;

      html += we.view.renderTemplate(t, this.theme, this);
    }

    html += '</div>';

    return new hbs.SafeString(html);
  }
}