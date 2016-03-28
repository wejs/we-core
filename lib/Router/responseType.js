var mime = require('mime');
/**
 * Parse response type middleware
 *
 * @param  {Object}   req  express.js request
 * @param  {Object}   res  express.js response
 * @param  {Function} next callback
 */
module.exports = function responseType(req, res, next) {
  if (!req.headers) req.headers = {};

  req.headers.accept = mime.lookup(parseResponseType(req));
  next();
}

/**
 * Parse the response type
 *
 * @param  {Object} req express.js request
 * @return {String}     the response type string
 */
function parseResponseType(req) {
  if (req.query && req.query.responseType)
    return req.query.responseType.toLowerCase();

  var type = req.accepts(req.we.config.responseTypes);
  if (type) return type;

  return 'html';
}