var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;

describe('ACLFeature', function() {
  var salvedUser, salvedUserPassword;
  var authenticatedRequest;

  before(function (done) {

    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();
    we.config.acl.disabled = false;

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);

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
      .end(function (err, res) {
        if(err) {
          console.error(res.text);
          throw err;
        }

        done();
      });
    })
  });

  describe('API', function() {
    it('we.acl.createRole create role and set it in we.acl.roles'  ,function(done) {
      var roleNameStrig = 'hero'
      we.acl.createRole({ name: roleNameStrig }, function(err, role) {
        if(err) throw err;
        assert(role);
        assert.equal(role.name, roleNameStrig);
        assert.equal( we.acl.roles[roleNameStrig].name,  role.name);
        done();
      });
    });
  })

  describe('anonymous', function () {

  });

  describe('authenticated/creator', function () {
    var salvedRole ;

    before(function (done) {
      var roleName = 'player';
      // after create a stub role
      we.acl.createRole({ name: roleName }, function(err, role) {
        if (err) throw err;
        if (!role) throw new Error('Role not created');

        salvedRole = role;
        done();
      });
    });
  });

  describe('admin', function () {
    before(function (done) {
      salvedUser.addRole('administrator')
      .then(function () {
        done();
      });
    });

    it('get /user/:id should return user for admin', function (done) {
      we.config.acl.disabled = false;
      authenticatedRequest
      .get('/user/'+ salvedUser.id)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          console.error(res.text);
          throw err;
        }
        assert(res.body.user);
        assert.equal(res.body.user.id, salvedUser.id);
        we.config.acl.disabled = true;
        done();
      });
    });
  });

  // after all tests
  after(function(done) {
    we.config.acl.disabled = true;

    done();
  });
});