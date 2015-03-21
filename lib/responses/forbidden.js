module.exports = function forbiddenResponse(data) {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(403);

  if (!res.locals.responseType || res.locals.responseType == 'html') {
    res.locals.template = '403';
    return res.view(data);
  }

  if (res.locals.responseType == 'json') {
    if (!res.locals.model) {
      // set messages
      data.messages = res.locals.messages;
      return res.send(data);
    }

    var response = {};
    response[res.locals.model] = data;
    response.meta = res.locals.metadata;

    // set messages
    response.messages = res.locals.messages;

    return res.send(response);
  }

  we.log.error('Unknow responseType:', res.locals.responseType);
}