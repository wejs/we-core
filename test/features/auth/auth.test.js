var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;
var we;
var agent;

describe('authFeature', function () {

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    done();
  });

  describe('register', function () {
    it('post /signup route should register one user and send a confirmation email', function (done) {

      we.config.auth.requireAccountActivation = true;

      var userStub = stubs.userStub();
      userStub.confirmPassword = userStub.password;
      userStub.confirmEmail = userStub.email;

      request(http)
      .post('/signup')
      .send(userStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {

        assert.equal(201, res.status);
        assert(res.body.messages);
        assert(res.body.messages[0].status);
        assert(res.body.messages[0].message);

        done();
      });
    });

    it('post /signup route should register and login the user without requireAccountActivation', function (done) {
      this.slow(300);

      we.config.auth.requireAccountActivation = false;

      var userStub = stubs.userStub();
      userStub.confirmPassword = userStub.password;
      userStub.confirmEmail = userStub.email;

      agent.post('/signup')
      .send(userStub)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {

        assert.equal(201, res.status);
        assert(res.headers['set-cookie'])
        assert(res.body.user.id);
        assert.equal(res.body.user.displayName, userStub.displayName);
        assert.equal(res.body.user.gender, userStub.gender);
        assert.equal(res.body.user.username, userStub.username);
        assert.equal(res.body.user.biography, userStub.biography);
        assert.equal(res.body.user.language, userStub.language);

        assert(res.body.token);

        // use setTime out to skip supertest error
        // see: https://github.com/visionmedia/superagent/commit/04a04e22a4126bd64adf85b1f41f2962352203d1
        setTimeout(function() {

          agent.get('/account')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {

            assert(res.body.user[0].id);
            assert.equal(res.body.user[0].displayName, userStub.displayName);
            assert.equal(res.body.user[0].gender, userStub.gender);
            assert.equal(res.body.user[0].username, userStub.username);
            assert.equal(res.body.user[0].biography, userStub.biography);
            assert.equal(res.body.user[0].language, userStub.language);

            done();
          });

        }, 100);

      });
    });

  });
});
