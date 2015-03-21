var passport = require('passport');

module.exports = {
  configureAndSetStrategies: function configureAndSetStrategies(we) {

    // set default we.js token strategy
    we.auth = require('./auth');

    if (we.config.passport) {
      var strategiesNames = Object.keys(we.config.passport.strategies);

      strategiesNames.forEach(function (strategyName) {
        we.log.silly('Loading the passport strategy:', strategyName);

        require('./' + strategyName)(we);
      })
    }

    // - serializers
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      we.models.user.find({
        where: {id: id},
        include: [ { model: we.db.models.role, as: 'roles'} ]
      }).done(function(err, user) {
        if (err) return done(err);

        done(err, user);
      });
    });

    we.express.use(passport.initialize());
    we.express.use(passport.session());

    we.passport = passport;
  }
}