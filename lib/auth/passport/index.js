var passport = require('passport');

module.exports = {
  configureAndSetStrategies: function configureAndSetStrategies(we) {

    if (we.config.passport) {
      var strategiesNames = Object.keys(we.config.passport.strategies);

      strategiesNames.forEach(function (strategyName) {
        we.log.silly('Loading the passport strategy:', strategyName);

        require('./' + strategyName)(we);
      })
    }

    // - serializers
    passport.serializeUser(function (user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
      we.models.user.find({
        where: {id: id},
        include: [ { model: we.db.models.role, as: 'roles'} ]
      }).then(function(user) {
        done(null, user);
      });
    });

    we.express.use(passport.initialize());
    we.express.use(passport.session());

    we.passport = passport;
  }
}