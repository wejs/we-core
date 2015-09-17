/**
 * We messages helper
 *
 * render all messages form current user locals
 *
 * usage:  {{we-messages}}
 */

module.exports = function(we) {
  return function weMessagesHelper() {
    var options = arguments[arguments.length-1];
    var locals = options.data.root;

    var messages = locals.req.res.getMessages();
    var theme = (locals.theme || we.view.appTheme);

    return new we.hbs.SafeString(we.view.renderTemplate('messages', theme, {
      messages: messages
    }));
  }
}