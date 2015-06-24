/**
 * We.js auth
 * @author Alberto Souza <contato@albertosouza.net>
 * @license [url] MIT
 */
var auth = {};

var passport = require('passport');

// load aouth2 modules
auth.util = require('./util.js');

auth.logIn = require('./logIn.js');
auth.logInWithCookie = require('./logInWithCookie.js');

auth.logOut = require('./logOut.js');

auth.tokenStrategy = function tokenStrategy(token, done) {
  var we = this.we;

  return we.db.models.accesstoken.find({ where: {
    token: token,
    isValid: true
  }}).then(function (tokenObj) {
    if (!tokenObj) return done(null, false);

    var accessTokenTime = we.config.passport.accessTokenTime;

    var notIsExpired = we.auth.util.checkIfTokenIsExpired(tokenObj, accessTokenTime);
    if (!notIsExpired) return done(null, false);

    we.db.models.user.find({
      where: {id: tokenObj.userId},
      include: [ { model: we.db.models.role, as: 'roles'} ]
    }).then(function (user) {
      if (!user) return done(null, false);
      // TODO add suport to scopes
      return done(null, user, { scope: 'all' });
    });
  });
}

auth.tokenMiddleware = function tokenMiddleware(req, res, next) {
  var we = req.getWe();

  passport.authenticate('bearer', { session: false }, function (err, user, scopes) {
    if (err) {
      we.log.error('Error on authenticate with bearer token', err);
      return res.serverError();
    }

    we.log.verbose('passport.bearer scopes:', scopes);

    req.user = user;

    next();
  })(req, res, next);
}

/**
 * Get redirect url
 * @param  {Object} req express request
 * @param  {[type]} res express response
 * @return {string|null} url or null
 *
 * TODO change to save this services in database
 */
auth.getRedirectUrl = function getRedirectUrl(req) {
  var we = req.getWe();

  if (req.query.service) {
    if (we.config.services && we.config.services[req.query.service]) {
      we.log.verbose(
        'Service redirect found for service: ', we.config.services[req.query.service]
      );
      return we.config.services[req.query.service].url
    }
  }

  if (req.query.redirectTo) {
    if (!we.router.isAbsoluteUrl(req.query.redirectTo))
      return req.query.redirectTo;
  }

  if (req.body.redirectTo) {
    if (!we.router.isAbsoluteUrl(req.body.redirectTo))
      return req.body.redirectTo;
  }

  return null;
}


//exports it!
module.exports = auth;