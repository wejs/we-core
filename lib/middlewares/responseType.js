module.exports = function responseType(req, res, next) {
  req.context.responseType = 'HTML';

  if (req.params.responseType == 'JSON') {
    req.context.responseType = 'JSON'
  }

  if (!req.context.responseType) {
    return res.badRequest({messages: [
      type: 'warning',
      message: 'Invalid responseType, valid options are: HTML or JSON'
    ]});
  } 

  next();
}