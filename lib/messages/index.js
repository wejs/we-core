var _ = require('lodash');

var messages = {};

messages.setFunctionsInResponse = function setFeaturesInResponse(req, res) {
  if (!res.locals.messages ) res.locals.messages = [];

  /**
   * add one message in res.messages array
   *
   * @param {String} status  success, error, warning, info ... etc
   * @param {String} message message text , use one translatable string
   * @param {Object} extraData    extra data to set in message
   */
  res.addMessage = function addMessage(status, message, extraData) {
    if (status == 'error') status = 'danger';
    if (status == 'warn') status = 'warning';

    if ( _.isObject(message) ) {
      message = req.__(message.text, message.vars);
    } else {
      message = req.__(message);
    }

    res.locals.messages.push({
      status: status,
      message: message,
      extraData: extraData
    })
  }

  /**
   * Get all messages
   *
   * @return {Array} messages array
   */
  res.getMessages = function getMessages() {
    var messages = [];

    if (this.locals && this.locals.messages) messages = this.locals.messages;

    // suport to flash messages
    if (this.locals.req.flash) {
      var flashMessages = this.locals.req.flash('messages');
      for (var i = 0; i < flashMessages.length; i++) {
        messages.push(flashMessages[i]);
      }
    }

    return messages;
  }

  /**
   * Move all locals messages to session (flash)
   *
   * This function is used in we.js redirects to store messages between page changes
   */
  res.moveLocalsMessagesToFlash = function moveLocalsMessagesToFlash() {
    req.flash('messages', res.getMessages());
  }
}

module.exports = messages;