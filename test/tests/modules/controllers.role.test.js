var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var controller, we;

describe('controllers.role', function () {
  var user, role;
  before(function (done) {
    controller = require('../../../server/controllers/role.js');
    we = helpers.getWe();
    role = we.acl.roles.authenticated;
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });

  describe('controllers.role.create', function () {
    it('create action should run res.ok if req.method=GET', function (done) {
      var res = { locals: {}, ok: function(){}};
      var req = { we: we, method: 'GET', body: {}};

      sinon.spy(res, 'ok');
      controller.create(req, res);
      assert(res.ok.called);
      done();
    });

    it('create action should run res.ok with record for POST and valid body', function (done) {
      var res = { locals: {}, ok: function(){
        assert(res.ok.called);
        assert.equal(res.ok.firstCall.args[0].name, 'coder');
        done();
      }};
      var req = {
        we: we, method: 'POST', body: {
          name: 'coder',
          description: 'Animal how converts coffe in software'
        }
      };
      sinon.spy(res, 'ok');
      controller.create(req, res);
    });
  });

  describe('controllers.role.updateUserRoles', function () {
    it('updateUserRoles action should run res.next dont find the user', function (done) {
      var res = { locals: {}};
      var req = { we: we, method: 'GET',
        params: {  userId: 23819038183188 }
      , body: {}};
      controller.updateUserRoles(req, res, function(){
        // called
        done();
      });
    });

    it('updateUserRoles action should run res.ok if req.method=GET', function (done) {
      var res = { locals: { data: role }, ok: function() {
        assert.equal(res.locals.roles, we.acl.roles);
        assert(res.locals.rolesTable);
        assert(res.ok.called);
        done();
      }};
      var req = { we: we, method: 'GET', body: {}, params: {  userId: user.id }};
      sinon.spy(res, 'ok');
      controller.updateUserRoles(req, res);
    });

    it('updateUserRoles action should run res.goTo for multiple valid userRoles', function (done) {
      var rolesIds = [
        we.acl.roles.administrator.id,
        we.acl.roles.authenticated.id
      ];
      var res = { locals: { data: role },
      addMessage: function(){},
      goTo: function() {
        assert(res.addMessage.called);
        assert(res.goTo.called);
        assert.equal(res.goTo.firstCall.args[0], '/role');
        done();
      }};
      var req = {
        we: we, method: 'POST', body: {
          userRoles: rolesIds
        },
        params: {  userId: user.id },
        url: '/role'
      };
      sinon.spy(res, 'goTo');
      sinon.spy(res, 'addMessage');
      controller.updateUserRoles(req, res);
    });


    it('updateUserRoles action should run res.goTo for single valid userRoles', function (done) {
      var res = { locals: { data: role },
      addMessage: function(){},
      goTo: function() {
        assert(res.addMessage.called);
        assert(res.goTo.called);
        assert.equal(res.goTo.firstCall.args[0], '/role');
        done();
      }};
      var req = {
        we: we, method: 'POST', body: {
          userRoles: we.acl.roles.administrator.id
        },
        params: {  userId: user.id },
        url: '/role'
      };
      sinon.spy(res, 'goTo');
      sinon.spy(res, 'addMessage');
      controller.updateUserRoles(req, res);
    });
  });

  describe('controllers.role.addPermissionToRole', function () {
    it('updateUserRoles action should run next if dont find the role', function (done) {
      var res = { locals: {}};
      var req = { we: we,
        params: {  roleName: 'invalid', permissionName: 'find_user' }
      , body: {}};
      controller.addPermissionToRole(req, res, function(){
        // called
        done();
      });
    });
    it('updateUserRoles action should run next if dont find the permission', function (done) {
      var res = { locals: {}};
      var req = { we: we,
        params: {
          roleName: 'administrator',
          permissionName: 'invalid perms'
        }
      , body: {}};
      controller.addPermissionToRole(req, res, function(){
        // called
        done();
      });
    });

    it('updateUserRoles action should run res.ok with role for valid data', function (done) {
      var res = { locals: {}, ok: function(){
        assert(res.ok.called);
        assert.equal(res.ok.firstCall.args[0].name, 'administrator');
        // called
        done();
      }};
      var req = { we: we,
        params: {
          roleName: 'administrator',
          permissionName: 'find_user'
        }
      , body: {}};
      sinon.spy(res, 'ok');
      controller.addPermissionToRole(req, res);
    });

    it('updateUserRoles action should run res.serverError if addPermissionToRole return error', function (done) {
      var oldFN = we.acl.addPermissionToRole;
      we.acl.addPermissionToRole = function(r, p, cb) {
        return cb(new Error('test error'));
      }
      var res = { locals: {}, serverError: function(){
        assert(res.serverError.called);
        assert(we.acl.addPermissionToRole);
        we.acl.addPermissionToRole.restore();
        we.acl.addPermissionToRole = oldFN;
        // called
        done();
      }};
      var req = { we: we,
        params: {
          roleName: 'administrator',
          permissionName: 'find_user'
        }
      , body: {}};
      sinon.spy(res, 'serverError');
      sinon.spy(we.acl, 'addPermissionToRole');
      controller.addPermissionToRole(req, res);
    });
  });

  describe('controllers.role.removePermissionFromRole', function () {
    it('removePermissionFromRole action should run next if dont find the role',
    function (done) {
      var res = { locals: {} };
      var req = { we: we,
        params: {  roleName: 'invalid', permissionName: 'find_user' }
      , body: {}};
      controller.removePermissionFromRole(req, res, function(){
        // called
        done();
      });
    });
    it('removePermissionFromRole action should run next if dont find the parmission',
    function (done) {
      var res = { locals: {} };
      var req = { we: we,
        params: {  roleName: 'administrator', permissionName: 'something invalid' }
      , body: {}};
      controller.removePermissionFromRole(req, res, function(){
        // called
        done();
      });
    });
    it('removePermissionFromRole action should run res.serverError if removePermissionFromRole return error',
    function (done) {
      var oldFN = we.acl.removePermissionFromRole;
      we.acl.removePermissionFromRole = function(r, p, cb) {
        return cb(new Error('test error'));
      }
      var res = { locals: {}, serverError: function(){
        assert(res.serverError.called);
        assert(we.acl.removePermissionFromRole);
        we.acl.removePermissionFromRole.restore();
        we.acl.removePermissionFromRole = oldFN;
        // called
        done();
      }};
      var req = { we: we,
        params: {
          roleName: 'administrator',
          permissionName: 'find_user'
        }
      , body: {}};
      sinon.spy(res, 'serverError');
      sinon.spy(we.acl, 'removePermissionFromRole');
      controller.removePermissionFromRole(req, res);
    });
    it('removePermissionFromRole action should run res.deleted if have valid data',
    function (done) {
      var res = { locals: {}, deleted: function(){
        // called
        done();
      }};
      var req = { we: we,
        params: {
          roleName: 'administrator',
          permissionName: 'create_user'
        }, body: {}};
      controller.removePermissionFromRole(req, res);
    });
  });
  describe('controllers.role.delete', function () {
    it('delete action should run res.ok for valid data', function (done) {
      we.acl.createRole({
        name: 'monster'
      }, function(err){
        if (err) throw err;

        var res = { locals: { id: we.acl.roles.monster.id },
        ok: function() {
          assert(res.ok.called);
          // called
          done();
        }};
        var req = { we: we, body: {}};
        sinon.spy(res, 'ok');
        controller.delete(req, res);
      });

    });

    it('delete action should run res.serverError if deleteRole return error', function (done) {
      var oldFN = we.acl.deleteRole;
      we.acl.deleteRole = function(r, cb) {
        return cb(new Error('test error'));
      }
      var res = { locals: {}, serverError: function(){
        assert(we.acl.deleteRole);
        we.acl.deleteRole.restore();
        we.acl.deleteRole = oldFN;
        assert(req.we.log.error.called);
        req.we.log.error.restore();
        req.we.log.error = oldError;
        // called
        done();
      }};
      var req = { we: we, body: {}};

      var oldError = req.we.log.error;
      req.we.log.error = function() {};
      sinon.spy(req.we.log, 'error');

      sinon.spy(res, 'serverError');
      sinon.spy(we.acl, 'deleteRole');
      controller.delete(req, res);
    });
  });
});