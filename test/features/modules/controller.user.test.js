var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var controller, we;

describe('controllers.user', function () {
  var user;
  before(function (done) {
    controller = require('../../../server/controllers/user.js');
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });

  describe('controllers.user.findOneByUsername', function () {
    it('findOneByUsername action should run next if username is not set', function (done) {
      var req = { we: we, params: {}};
      var res = { locals: {} };
      controller.findOneByUsername(req, res, function(){
        // called
        done();
      });
    });

    it('findOneByUsername action should run next if not find the user', function (done) {
      var req = { we: we, params: { username: 'unknowname' }};
      var res = { locals: { Model: we.db.models.user } };
      controller.findOneByUsername(req, res, function(){
        // called
        done();
      });
    });

    it('findOneByUsername action should run next with found user', function (done) {
      var req = { we: we, params: { username: user.username }};
      var res = {
        locals: { Model: we.db.models.user },
        ok: function(u){
          assert.equal(u.id, user.id)
          assert.equal(u.username, user.username);
          // called
          done();
        }
      };
      controller.findOneByUsername(req, res);
    });
  });

  describe('controllers.user.create', function () {
    it('create action should run res.ok if req.method!=POST', function (done) {
      var req = { we: we,
        query: {
          something: 'something'
        },
        params: {}
      };
      var res = { locals: {}, ok: function() {
        assert.equal(res.locals.data.something, 'something');
        done();
      }};
      controller.create(req, res);
    });
  });

  describe('controllers.user.edit', function () {
    it('edit action should run res.ok if req.method!=POST', function (done) {
      we.config.acl.disabled = false;
      var req = { we: we,
        userRoleNames: [ 'administrator'],
        params: {}
      };
      var res = { locals: {}, ok: function() {
        we.config.acl.disabled = true;
        done();
      }};
      controller.edit(req, res);
    });

    it('edit action should run next if res.locals.data not is pre loaded', function (done) {
      var req = { we: we, method: 'POST',
        body: { displayName: 'A Hero!' },
        params: {}
      };
      var res = { locals: {} };
      controller.edit(req, res, function(){
        // called
        done();
      });
    });

    it('edit action should update user record and run res.updated', function (done) {
      var req = { we: we, method: 'POST',
        body: { displayName: 'A Hero!' },
        params: {}
      };
      var res = { locals: { data: user },
        updated: function(){
          assert.equal(res.locals.data.displayName, 'A Hero!');
          // called
          done();
        }
      };
      controller.edit(req, res);
    });
  });
});