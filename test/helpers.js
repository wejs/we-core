var helpers = {};

helpers.getHttp = function getHttp() {
  return  require('../lib').http;
}

helpers.getDB = function getDB() {
  return require('../lib/database');
}

helpers.capitalize = function capitalize(s){
  return s[0].toUpperCase() + s.slice(1);
}

helpers.getWe = function getWe() {
  return require('../lib');
}

helpers.createUser = function(user, done) {
  var we = helpers.getWe();

  we.db.models.user.create(user).done(function (error, newUser) {
    if (error) return done(error);

    we.db.models.password.create({
      userId: newUser.id,
      password: user.password
    }).done(function (error, password) {
      if (error) return done(error);

      newUser.setPassword(password).then(function () {
        done(null, newUser, password);
      });
    });
  });
}

module.exports = helpers;