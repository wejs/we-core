module.exports = function serverErrorResponse(data) {
  var req = this.req;
  var res = this.res;
  var we = req.getWe();

  res.status(500);

  if (!res.locals.responseType || res.locals.responseType == 'html') {
    return res.render(data);
  }

  if (res.locals.responseType == 'json') {
    if (!res.locals.model) {
      return res.send(data);
    }

    return res.send(data);
  }

  we.log.error('Unknow responseType:', res.locals.responseType);
}