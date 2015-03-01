module.exports = function responseType(req, res, next) {
  req.context.responseType = 'HTML';

  if (req.params.responseType == 'JSON') {
    req.context.responseType = 'JSON'
  }
  
  next();
}