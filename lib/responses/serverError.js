module.exports = function serverErrorResponse(data) {
  var req = this.req;
  var res = this.res;
  var we = req.getWe();

  res.status(500);

  if (!req.context.responseType || req.context.responseType == 'html') {
    return res.render(data);
  }

  if (req.context.responseType == 'json') {
    if (!req.context.model) {
      return res.send(data);
    }

    return res.send(data);
  }

  we.log.error('Unknow responseType:', req.context.responseType);
}