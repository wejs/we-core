var passport = require('passport');
 
module.exports = {
  configureAndSetStrategies: function configureAndSetStrategies(we) {

    if (we.config.passport) {
      var strategiesNames = Object.keys(we.config.passport.strategies);

      strategiesNames.forEach(function(strategieName) {
        we.log.silly('Loading the passport strategy:', strategieName);
        
        var strategy = require('./' + strategieName);
        // start the strategy
        strategy(we);
      })
    }

    // - serializers
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      we.models.user.find(id).done(function(err, user) {
        done(err, user);
      });
    });

    we.express.use(passport.initialize());
    we.express.use(passport.session());

    we.passport = passport;
  }
}