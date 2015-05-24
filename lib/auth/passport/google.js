var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;

module.exports = function initPassportGoogleStrategy(we) {
  // - googleStrategy
  passport.use(new GoogleStrategy({
      returnURL: 'http://www.example.com/auth/google/return',
      realm: 'http://www.example.com/'
    },
    function aferAuthenticateInGoogle(identifier, profile, done) {
      we.log.warn('TODO> googlestrategy>', identifier, profile);
      we.models.user.findOrCreate({ openId: identifier }, function(err, user) {
        done(err, user);
      });
    }
  ));
  // Redirect the user to Google for authentication.  When complete, Google
  // will redirect the user back to the application at
  //     /auth/google/return
  we.express.get('/auth/google', passport.authenticate('google'));

  // Google will redirect the user to this URL after authentication.  Finish
  // the process by verifying the assertion.  If valid, the user will be
  // logged in.  Otherwise, authentication has failed.
  we.express.get('/auth/google/return', passport.authenticate('google', { 
    successRedirect: '/',
    failureRedirect: '/login' 
  }));
}