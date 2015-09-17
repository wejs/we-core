/**
 * Login one user and set its access token
 *
 * @param  {object}   request
 * @param  {object}   response
 * @param  {object}   newUser
 * @param  {Function} cb
 */
module.exports = function logIn(req, res, newUser, cb) {
  if (req.body.persistent) {
    req.session.cookie.maxAge = req.we.config.passport.expiresTime;
  } else {
    req.session.cookie.expires = false;
  }

  req.login(newUser, function (err) {
    if (err) return cb(err);
    cb(null);
  });
}