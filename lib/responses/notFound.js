module.exports = function notFoundResponse(data) {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  if (!data) data = {};

  res.status(404);

  if (!res.locals.responseType || res.locals.responseType == 'html') {
    return res.render(data);
  }

  if (res.locals.responseType == 'json') {
    data.messages = res.locals.messages;
    return res.send(data);
  }

  we.log.error('Unknow responseType:', res.locals.responseType);
}