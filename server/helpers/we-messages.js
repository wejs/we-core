/**
 * We menu helper
 *
 * render one menu from app configs
 *
 * usage:  {{#we-menu 'manuName'}} {{/we-menu}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function renderMessages() {
    var options = arguments[arguments.length-1];
    var messages = [];
    var html = '';

    var theme = options.data.root.theme;
    if (!theme) theme = we.view.appTheme;

    if (options.data.root && options.data.root.messages) {
      messages = options.data.root.messages;
    }

    html += we.view.renderTemplate('messages', theme, {
      messages: messages
    });

    return new hbs.SafeString(html);
  }
}