var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var _ = require('lodash');
var http;
var we;

describe('permissionsFeature', function() {
  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    done();
  });

  describe('Model', function() {
    it('we.acl.addPermissionToRole should add a role to permission', function(done) {
      var roleName = we.acl.roles.owner.name;
      var permissionName = 'user_findOneByUsername';
      we.acl.addPermissionToRole(we, roleName, permissionName, function(err, role) {
        if (err) return done(err);
        assert(role);
        assert(role.permissions);
        assert(role.permissions.indexOf(permissionName) > -1);
        done();
      })
    });
  });

  describe('API', function() {
    it('get /permission should return all permissions list', function(done) {
      request(http)
      .get('/permission')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.permission);
        assert( _.isArray( res.body.permission ) );
        done();
      });
    });

    it('get /role should return roles with permissions attr', function(done) {
      request(http)
      .get('/role')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.role);
        assert( _.isArray( res.body.role ) );
        res.body.role.forEach(function(r){
          assert(_.isArray(r.permissions));
        });
        done();
      });
    });

    it('post /permission should return 404', function(done) {
      request(http)
      .post('/permission')
      .send({
        name: 'one_permission_name'
      })
      .set('Accept', 'application/json')
      .expect(404)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
    });

    it('post /role/:id/permissions should add one permission to role', function(done) {
      var permissionName = 'find_post';
      var roleName = 'owner';
      request(http)
      .post('/role/' + roleName + '/permissions/' + permissionName)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.role);
        assert.equal(res.body.role.length, 1);
        assert(res.body.role[0].permissions.indexOf(permissionName) > -1);
        done();
      });
    });
  })
})