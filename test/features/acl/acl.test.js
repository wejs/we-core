var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var sinon = require('sinon');
var _ = require('lodash');
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
    helpers.createUser(userStub, function(err, user, password) {
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

        done();
      });
    })
  });

  describe('API', function() {
    it('we.acl.init should create default roles on init', function(done) {

      we.db.models.role.findAll().done(function(err, roles) {
        if(err) return done(err);

        assert(roles);
        assert.equal(4, roles.length);

        done();
      });
    })

    it('we.acl.getAllActionPermisons return all we.acl action permissions'  ,function(done) {
      we.acl.getAllActionPermisons(we, function (err, permissions) {
        if(err) return done(err);
        assert(permissions);
        // console.log(permissions)
        we.log.info('Total of: '+ Object.keys(permissions).length + ' permissions');
        done();
      });
    })

    it('we.acl.fetchAllActionPermissions should fetch and create all action permissions'  ,function(done) {

      we.acl.fetchAllActionPermissions(we, function(err, permissions) {
        if(err) return done(err);
        assert(permissions);
        console.log(JSON.stringify(permissions, null, '\t') )

        we.log.info('Total of: '+ permissions.length + ' permissions');
        done();
      })

    });
  })

  describe('anonymous', function (){

  });

  describe('authenticated/creator', function (){

  });

  describe('admin', function (){

  });

  // after clear DB
  after(function(done) {
    we.config.acl.disabled = true;

    done();
  });
});