var stubs = require('./stubs');
var request = require('supertest');

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

helpers.createAndLoginUser = function(done) {
  var userStub = stubs.userStub();
  helpers.createUser(userStub, function(err, user) {
    if (err) throw new Error(err);

    var salvedUser = user;
    var salvedUserPassword = userStub.password;

    // login user and save the browser
    var authenticatedRequest = request.agent(helpers.getHttp());
    authenticatedRequest.post('/login')
    .set('Accept', 'application/json')
    .send({
      email: salvedUser.email,
      password: salvedUserPassword
    })
    .expect(200).end(function(err, res) {
      if (err) return done(err);

      done(null, {
        salvedUser: salvedUser,
        salvedUserPassword: salvedUserPassword,
        authenticatedRequest: authenticatedRequest,
        token: res.body.token
      });
    });
  });
}

module.exports = helpers;