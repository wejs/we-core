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

auth.validSignup = require('./validSignup.js');

auth.tokenStrategy = function tokenStrategy(token, done) {
  var we = this.we;

  we.db.models.accesstoken.find({ where: {
    token: token,
    isValid: true
  }}).done(function (err, tokenObj) {
    if (err) return done(err);
    if (!tokenObj) return done(null, false);

    var accessTokenTime = we.config.passport.accessTokenTime;

    var notIsExpired = we.auth.util.checkIfTokenIsExpired(tokenObj, accessTokenTime);
    if (!notIsExpired) return done(null, false);

    we.db.models.user.find({
      where: {id: tokenObj.userId},
      include: [ { model: we.db.models.role, as: 'roles'} ]
    }).done(function (err, user) {
      if (err) return done(err, null);
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

//exports it!
module.exports = auth;