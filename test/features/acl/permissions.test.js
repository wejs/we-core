var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;
var we;

describe('permissionsFeature', function() {
  before(function (done) {

    http = helpers.getHttp();
    we = helpers.getWe();

    we.acl.fetchAllActionPermissions(we, function(err, permissions) {
      if(err) return done(err);
      assert(permissions);
      //console.log(JSON.stringify(permissions, null, '\t') )

      we.log.info('Total of: '+ permissions.length + ' permissions');
      done();
    })
  });

  describe('Model', function() {
    it('we.acl.addRoleToPermission should add a role to permission', function(done) {

      var roleName = we.acl.roles.owner.name;
      var permissionName = 'user_findOneByUsername';

      we.acl.addRoleToPermission(we, roleName, permissionName, function(err, permission) {
        if (err) return done(err);

        assert(permission);
        assert(permission.roles);
        assert(permission.roles.length > 0);

        var haveRole = false;
        for (var i = permission.roles.length - 1; i >= 0; i--) {
          if ( permission.roles[i].name == roleName ) {
            haveRole = true;
            break;
          }
        }

        assert.equal(we.acl.permissions[ permissionName ].updatedAt, permission.updatedAt);
        assert(haveRole, true);

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

    it('get /permission/:id should find One permission by id', function(done) {
      var permissionName = 'user_findOne';

      we.acl.addRoleToPermission(we, 'authenticated', permissionName, function(err, permission) {
        if (err) return done(err);

        request(http)
        .get('/permission/' + permission.id)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          assert(res.body.permission[0].id);
          assert.equal(res.body.permission[0].id, permission.id);

          done();
        });
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


    it('post /permission/:id/roles should add one role to permission', function(done) {
      var permissionName = 'user_findOneByUsername';
      var salvedPermission = we.acl.permissions[ permissionName ];
      var roleName = we.acl.roles.authenticated.name;

      request(http)
      .post('/permission/' + salvedPermission.id + '/roles')
      .send({
        roleName: roleName
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        assert(res.body.permission);
        assert.equal(res.body.permission.length, 1);

        assert.equal(res.body.permission[0].id, salvedPermission.id);
        assert.equal(res.body.permission[0].name, salvedPermission.name);

        var haveRole = false;
        for (var i = res.body.permission[0].roles.length - 1; i >= 0; i--) {
          if ( res.body.permission[0].roles[i] == we.acl.roles.authenticated.id ) {
            haveRole = true;
            break;
          }
        }

        assert(haveRole, true);

        done();
      });
    })


    it('get /api/v1/fetchActionPermissions should add one role to permission', function(done) {
      request(http)
      .get('/api/v1/fetchActionPermissions')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        assert(res.body.permission);
        assert( _.isArray( res.body.permission ) );

        assert( res.body.permission.length > 15 );

        done();
      });
    });
  })
})