var _ = require('lodash');

module.exports = function okResponse(data) {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(201);

  if (!req.context.responseType || req.context.responseType == 'html') {
    return res.render(data);
  }

  if (req.context.responseType == 'json') {
    if (!req.context.model) {
      return res.send(data);
    }

    var response = {};

    if ( _.isArray(data)) {
      response[req.context.model] = data;
    } else {
      response[req.context.model] = [ data ];
    }
    
    response.meta = res.locals.metadata;

    return res.send(response);
  }

  we.log.error('Unknow responseType:', req.context.responseType);
}