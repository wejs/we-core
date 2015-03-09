module.exports = function responseType(req, res, next) {
  req.context.responseType = 'html';

  req.context.responseType = parseResponseType(req);

  next();
}

function parseResponseType(req) {
  if (req.headers) {
    if (req.headers.accept == 'application/json') {
      return 'json'
    } 
  }

  if (req.params && req.params.responseType) {
    return req.params.responseType.toLowerCase();
  }

  return 'html';
}