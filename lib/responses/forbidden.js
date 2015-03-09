module.exports = function forbiddenResponse(data) {
  var res = this.res;
  var req = this.req;

  res.status(403);

  if (!req.context.responseType || req.context.responseType == 'html') {
    res.render(data);
  }

  if (req.context.responseType == 'json') {
    if (!req.context.model) {
      return res.send(data);
    }

    var response = {};
    response[req.context.model] = data;
    response.meta = res.locals.metadata;

    return res.send(response);
  }

  we.log.error('Unknow responseType:', req.context.responseType);
}