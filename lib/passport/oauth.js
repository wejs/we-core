var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

module.exports = function initOauthStrategy(we) {
  // - Oauth
  passport.use('provider', new OAuth2Strategy({
      authorizationURL: 'https://www.provider.com/oauth2/authorize',
      tokenURL: 'https://www.provider.com/oauth2/token',
      clientID: '123-456-789',
      clientSecret: 'shhh-its-a-secret',
      callbackURL: 'https://www.example.com/auth/provider/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      we.log.warn('TODO configure oauth passport')
      // we.models.user.findOrCreate(..., function(err, user) {
      //   done(err, user);
      // });
    }
  ));

  we.express.get('/auth/provider',
    passport.authenticate('provider', { scope: 'email' })
  );
  we.express.get('/auth/provider',
    passport.authenticate('provider', { scope: ['email', 'sms'] })
  );
}