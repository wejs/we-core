module.exports = function badResponse(data) {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(400);

  if (!req.context.responseType || req.context.responseType == 'html') {
    res.locals.template = '400';
    return res.view(data);
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