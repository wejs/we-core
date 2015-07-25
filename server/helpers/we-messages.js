/**
 * We messages helper
 *
 * render all messages
 *
 * usage:  {{we-messages}}
 */

module.exports = function(we) {
  return function renderMessages() {
    var options = arguments[arguments.length-1];
    var html = '';
    var locals = options.data.root;

    var messages = locals.req.res.getMessages();

    var theme = locals.theme;
    if (!theme) theme = we.view.appTheme;

    html += we.view.renderTemplate('messages', theme, {
      messages: messages
    });

    return new we.hbs.SafeString(html);
  }
}