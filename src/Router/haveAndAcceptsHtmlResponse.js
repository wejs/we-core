/**
 * Check if have or accepts html response, usefull for features like redirect on html response format
 */
module.exports = function haveAndAcceptsHtmlResponse(req, res) {
  if (
    req.accepts('html') &&
    ( res.locals.responseType == 'html' ||
      ( req.we.config.responseTypes.indexOf('html') > -1 )
    )
  ) {
    return true;
  } else {
    return false;
  }
};