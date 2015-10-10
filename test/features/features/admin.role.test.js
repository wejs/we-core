var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var http;
var we;
var agent;

describe('roleFeature', function () {
  var salvedUser, salvedUserPassword;
  var authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      // login user and save the browser
      authenticatedRequest = request.agent(http);
      authenticatedRequest.post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function () {
        done();
      });
    })

  });

  it('get /admin/permission/role should return roles list', function (done) {
    request(http)
    .get('/admin/permission/role')
    .set('Accept', 'application/json')
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
      assert(res.body.role);
      assert(res.body.meta.count>3);
      res.body.role.forEach(function(r){
        assert(r.name);
        assert(r.id);
      });
      done();
    });
  });

  it('post /admin/permission/role/create should create one role and add it in we.acl roles');
});