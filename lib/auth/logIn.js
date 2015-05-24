/**
 * Login one user and set its access token
 *
 * @param  {object}   request
 * @param  {object}   response
 * @param  {object}   newUser
 * @param  {Function} cb
 */
module.exports = function logIn(req, res, newUser, cb) {
  var we = req.getWe();

  var domain = we.config.passport.cookieDomain;
  var name = we.config.passport.cookieName;
  var cookieSecure = we.config.passport.cookieSecure;

  return we.db.models.accesstoken.create({
    userId: newUser.id
  })
  .then(function(tokenObj) {
    var options = {};
    if(domain) options.domain = domain;
    if(cookieSecure) options.secure = cookieSecure;

    res.cookie(name, tokenObj.token, options);

    cb(null, tokenObj);
  });
}