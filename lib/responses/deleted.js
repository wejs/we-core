var _ = require('lodash');

module.exports = function deletedResponse() {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(204);

  return we.hooks.trigger('we:before:send:deletedResponse', {
    req: req,
    res: res
  }, function() {
    if (!res.locals.responseType || res.locals.responseType == 'html') {
      return res.view();
    }

    if (res.locals.responseType == 'json') {
      if (!res.locals.model) {
        return res.send({
          messages: res.locals.messages,
          meta: res.locals.metadata
        });
      }

      var response = {};

      response.meta = res.locals.metadata;

      if (!_.isEmpty( res.locals.messages) ) {
        // set messages
        response.messages = res.locals.messages;
      }

      return res.send(response);
    }

    we.log.error('Unknow responseType:', res.locals.responseType);
  });
}