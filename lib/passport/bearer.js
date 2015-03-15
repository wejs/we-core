var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;

module.exports = function init(we) {

  // -- bearer token
  passport.use(new BearerStrategy(
    function(token, done) {

      we.db.models.passport.find({ where:
        { token: token }
      }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user, { scope: 'read' });
      });
    }
  ));

  we.express.all( function(req, res, done) {
    passport.authenticate('bearer', {session: false}, function(err, user, info) {
      if (err) return done(err);
      if (user) return done();

      return res.send(403, {message: 'You are not permitted to perform this action.'});
    })(req, res);
  });

}