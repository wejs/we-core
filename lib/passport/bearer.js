var passport = require('passport')
  , BearerStrategy = require('we-passport-http-bearer').Strategy;

module.exports = function init(we) {

  passport.use(new BearerStrategy(
    function(token, done) {

      we.db.models.accesstoken.find({ where: {
        token: token,
        isValid: true
      }}).done(function (err, tokenObj) {
        if (err) return done(err);
        if (!tokenObj) return done(null, false);

        var accessTokenTime = we.config.passport.accessTokenTime;

        var notIsExpired = checkIfTokenIsExpired(tokenObj, accessTokenTime);
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
  ));

  we.express.use(function (req, res, next) {
    passport.authenticate('bearer', { session: false }, function (err, user, scopes) {
      if (err) {
        we.log.error('Error on authenticate with bearer token', err);
        return res.serverError();
      }

      we.log.verbose('passport.bearer scopes:', scopes);

      req.user = user;

      next();
    })(req, res, next);
  })
}

/**
 * Check if one token is expired
 *
 * @param  {object} token           AccessToken record
 * @param  {int} accessTokenTime    valid token max time
 * @return {boolean}
 */
function checkIfTokenIsExpired(token, accessTokenTime) {
  // skip if dont set accessToken time
  if(!accessTokenTime) return true;
  // check if cache is valid
  var dateNow =  new Date().getTime(),
    timeDiference = dateNow - token.createdAt;
  // if cache is valid return cached page data
  if (timeDiference <= accessTokenTime) {
    // is valid
    return true;
  } else {
    // is expired
    return false;
  }
}