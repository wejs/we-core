var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;

describe('adminUserFeature', function () {
  var salvedUser;

  before(function (done) {
    http = helpers.getHttp();
    // after all create one user
    request(http)
    .post('/user')
    .set('Accept', 'application/json')
    .expect(201)
    .send( stubs.userStub() )
    .end(function (err, res) {
      if (err) return done(err);
      salvedUser = res.body.user[0];
      done();
    });
  });


  describe('find', function () {
    it('get /admin/user route should return users list', function (done) {
      request(http)
      .get('/admin/user')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.user);
        assert( _.isArray(res.body.user) , 'user not is array');
        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {
    it('post /admin/user/create should create one user record', function (done) {
      this.slow(300);
      var userStub = stubs.userStub();

      request(http)
      .post('/admin/user/create')
      .set('Accept', 'application/json')
      .send(userStub)
      .end(function (err, res) {
        if (err) console.error(err);
        assert.equal(201, res.status);
        assert(res.body.user);

        var user = res.body.user[0];
        // check user attrs
        assert.equal(user.username, userStub.username);
        assert.equal(user.displayName, userStub.displayName);
        //assert.equal(user.fullName, userStub.fullName);
        assert.equal(user.biography, userStub.biography);
        assert.equal(user.language, userStub.language);
        assert.equal(user.gender, userStub.gender);

        done();
      });
    });

  });

});