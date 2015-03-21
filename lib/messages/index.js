
var messages = {};

messages.setFunctionsInResponse = function setFeaturesInResponse(req, res) {
  if (!res.locals.messages ) res.locals.messages = [];

  /**
   * add one message in res.messages array
   *
   * @param {String} status  success, error, warning, info ... etc
   * @param {String} message message text , use one translatable string
   * @param {Object} data    extra data to set in message
   */
  res.addMessage = function addMessage(status, message, data) {
    if (status == 'error') status = 'danger';

    res.locals.push({
      status: status,
      message: req.__(message),
      data: data
    })
  }

}

module.exports = messages;