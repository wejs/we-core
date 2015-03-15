var env = require('../env');

module.exports = function serverErrorResponse(data) {
  var req = this.req;
  var res = this.res;
  var we = req.getWe();

  if (env != 'prod') {
    console.trace('Error get in serverErrorResponse:', data); 
  } 

  res.status(500);

  if (!req.context.responseType || req.context.responseType == 'html') {
    res.render(data);
  }

  if (req.context.responseType == 'json') {
    if (!req.context.model) {
      return res.send(data);
    }

    return res.send(data);
  }

  we.log.error('Unknow responseType:', req.context.responseType);  
}