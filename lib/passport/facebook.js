var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function initFacebookStrategy(we) {

  passport.use(new FacebookStrategy({
      clientID: we.config.FACEBOOK_APP_ID,
      clientSecret: we.config.FACEBOOK_APP_SECRET,
      callbackURL: 'http://www.example.com/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      we.log.warn('TODO initFacebookStrategy');
      done();
    }
  ));

  // Redirect the user to Facebook for authentication.  When complete,
  // Facebook will redirect the user back to the application at
  //     /auth/facebook/callback
  we.express.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['read_stream', 'publish_actions']
  }));

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  we.express.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
}