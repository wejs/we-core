module.exports = function serverErrorResponse(data) {
  var req = this.req;
  var res = this.res;

  res.status(500);

  if (!req.context.responseType || req.context.responseType == 'HTML') {
    res.render(data);
  }

  if (req.context.responseType == 'JSON') {
    if (!req.context.model) {
      return res.send(data);
    }

    return res.send(data);
  }

  we.log.error('Unknow responseType:', req.context.responseType);  
}