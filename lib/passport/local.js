var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function initLocalStrategy(we) {
  // - Local
  passport.use(new LocalStrategy(
    we.config.passport.strategies.local
  , function findUserAndValidPassword(email, password, done) {
      // build the find user query
      var query = { where: {}};
      query.where[we.config.passport.strategies.local.usernameField] = email;
      // find user in DB
      we.models.user.find(query).done(function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));    

  // - Passport config
  we.express.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {  return next(err); }
      if (info) { we.log.info('Passport:local:login:', info); }
      if (!user) { return res.redirect('/login'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/users/' + user.username);
      });
    })(req, res, next);
  });
  
}