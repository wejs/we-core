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
      message: req.__(message),
      extraData: extraData
    })
  }

}

module.exports = messages;