/**
 * Log out current user
 *
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} cb
 */
module.exports = function logOut(req, res, cb) {
  var we = req.getWe();

  var domain = we.config.passport.cookieDomain;
  var name = we.config.passport.cookieName;
  var cookieSecure = we.config.passport.cookieSecure;

  var options = {};
  if(domain) options.domain = domain;
  if(cookieSecure) options.secure = cookieSecure;
  res.clearCookie(name, options);
  cb();
}