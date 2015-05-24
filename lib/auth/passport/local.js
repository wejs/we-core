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
      we.db.models.user.find(query).then(function(user) {
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        // get the user password
        user.getPassword().then(function(passwordObj) {
          if(!passwordObj) return done(null, false, { message: 'auth.login.user.dont.have.password' });

          passwordObj.validatePassword(password, function (err, isValid){
            if (err) return done(err);

            if (!isValid) {
              return done(null, false, { message: 'auth.login.user.incorrect.password.or.email' });
            } else {
              return done(null, user);
            }

          });

        })

      });
    }
  ));

}