module.exports = function notFoundResponse() {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(404);

  if (!res.locals.responseType || res.locals.responseType == 'html') {
    return res.render(data);
  }

  if (res.locals.responseType == 'json') {
    return res.send({ messages: res.locals.messages });
  }

  we.log.error('Unknow responseType:', res.locals.responseType);
}