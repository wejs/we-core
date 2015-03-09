var _ = require('lodash');

module.exports = function okResponse(data) {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(404);

  if (!req.context.responseType || req.context.responseType == 'html') {
    return res.render(data);
  }

  if (req.context.responseType == 'json') {
    return res.send();
  }

  we.log.error('Unknow responseType:', req.context.responseType);
}