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
        //console.log(JSON.stringify(permissions, null, '\t') )

        we.log.info('Total of: '+ permissions.length + ' permissions');
        done();
      })
    });

    it('we.acl.createRole create role and set it in we.acl.roles'  ,function(done) {
      var roleNameStrig = 'hero'
      we.acl.createRole(we, { name: roleNameStrig }, function(err, role) {
        if(err) return done(err);
        assert(role);
        assert(role.id);
        assert.equal(role.name, roleNameStrig);
        assert.equal( we.acl.roles[roleNameStrig].id,  role.id);
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
      we.acl.createRole(we, { name: roleName }, function(err, role) {
        if (err) return done(err);
        if (!role) throw new Error('Role not created');

        salvedRole = role;
        done();
      });
    });

    it('post /user/:id/role should add one role to user', function (done) {
      authenticatedRequest
      .post('/user/'+ salvedUser.id +'/role')
      .send({ roleName: salvedRole.name})
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert.ok(res.body.messages)
        assert.equal( res.body.messages[0].message, 'role.addRoleToUser.success');
        assert.equal( res.body.messages[0].status, 'success' );

        salvedUser.hasRole(salvedRole).done(function(err, result){
          if(err) return done(err);

          assert.equal(result, true);
          done();
        });
      });
    });

    it('get /user/:id should return 403 for unauthorized user', function (done) {
      we.config.acl.disabled = false;

      authenticatedRequest
      .get('/user/'+ salvedUser.id)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 403);
        assert( _.isEmpty( res.body.user ));

        we.config.acl.disabled = true;
        done();
      });
    });

  });

  describe('admin', function () {


  });

  // after all tests
  after(function(done) {
    we.config.acl.disabled = true;

    done();
  });
});