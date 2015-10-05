var passport = require('passport');

module.exports = {
  configureAndSetStrategies: function configureAndSetStrategies(we) {
    // disable if we.config.passport is null
    if (!we.config.passport || !we.config.passport.strategies) return;
    // save strategy names for auth login
    we.auth.strategyNames = Object.keys(we.config.passport.strategies);

    we.auth.strategyNames.forEach(function (name) {
      var strategy = we.config.passport.strategies[name];

      if (!strategy.Strategy)
        throw new Error('we.config.passport.strategies.'+name+'.Strategy is required');
      if (!strategy.findUser)
        throw new Error('we.config.passport.strategies.'+name+'.findUser function is required');

      passport.use(new strategy.Strategy(strategy, strategy.findUser.bind({ we: we })));
    });
    // initialize and set session
    we.express.use(passport.initialize());
    // session suport
    if (we.config.passport.enableSession) {
      // - serializer, serialize user to save in session
      passport.serializeUser(function (user, done) {
        done(null, user.id);
      });
      // deserializer, get data from db with session get from id
      passport.deserializeUser(function (id, done) {
        we.db.models.user.find({
          where: { id: id },
          include: [ { model: we.db.models.role, as: 'roles'} ]
        }).then(function (user) {
          done(null, user);
        });
      });

      we.express.use(passport.session());
    }
    // save passport in we.passport
    we.passport = passport;
  }
}