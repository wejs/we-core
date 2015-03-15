
/**
 * Login one user with valid access token with cokie
 *
 * @todo  add suport passport auth
 *
 * @param  {object}   user
 * @param  {Function} cb
 */
module.exports = function logInWithCookie(accessToken, req, res, cb) {
  var we = req.getWe(),
  cookieConfigs = {
      maxAge: we.config.passport.strategies.weOauth2.maxAge,
      path: '/'
    },
    domain = we.config.passport.strategies.weOauth2.cookieDomain,
    userId;

  we.log.silly('Authenticating user with oauth2.logInWithCookie', accessToken, cookieConfigs);

  /**
   * get user it from providerUserId if are in consumer system or from userId in provider
   */
  if (accessToken.providerUserId) {
    userId = accessToken.providerUserId;
  } else {
    userId = accessToken.userId;
  }
  // then store it on cookie to client side software
  // TODO enforces the use of https
  if (domain) {
    cookieConfigs.domain = domain;
  }

  res.cookie('weAuthToken', accessToken.token, cookieConfigs);

  if (cb) cb();

}
