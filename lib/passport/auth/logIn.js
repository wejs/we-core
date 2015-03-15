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

  var domain = we.config.passport.strategies.weOauth2.cookieDomain;
  var name = we.config.passport.strategies.weOauth2.cookieName;
  var cookieSecure = we.config.passport.strategies.weOauth2.cookieSecure;

  we.db.models.accesstoken.create({
    userId: newUser.id
  })
  .done(function(err, tokenObj) {
    if(err) {
      we.log.error('Error on generate token for user', err);
      return cb(err);
    }

    var options = {};
    if(domain) options.domain = domain;
    if(cookieSecure) options.secure = cookieSecure;

    res.cookie(name, tokenObj.token, options);

    cb(null, tokenObj);
  });
}