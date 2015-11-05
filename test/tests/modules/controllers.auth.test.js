var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var controller, we;

describe('controllers.auth', function () {
  var user;
  before(function (done) {
    controller = require('../../../server/controllers/auth.js');
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function (err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });

  describe('controllers.auth.signup', function () {
    it('signup action should run res.forbidden if we.config.auth.allowRegister is false', function (done) {
      var res = { locals: {}, forbidden: function(){}};
      sinon.spy(res, 'forbidden');
      we.config.auth.allowRegister = false;
      controller.signup({ we: we }, res);
      assert(res.forbidden.called);
      we.config.auth.allowRegister = true;
      done();
    });

    it('signup action should run  we.log.info and return nothing if req.body.mel is set', function (done) {
      var res = { locals: {} ,forbidden: function(){}};
      sinon.spy(we.log, 'info');
      controller.signup({ we: we, body: { mel: 'test' } }, res);
      assert(we.log.info.called);
      we.log.info.restore();
      done();
    });

    it('signup action should run res.ok if request have a GET method', function (done) {
      var res = { locals: {}, ok: function(){}};
      sinon.spy(res, 'ok');
      controller.signup({
        we: we, method: 'GET', body: {}, logout: function() {}
      }, res);
      assert(res.ok.called);
      done();
    });
  });

  describe('controllers.auth.newPassword', function () {
    it('newPassword action should run res.goTo if req.session.resetPassword is true and req.user.id is diferent than req.params.id', function (done) {
      var res = { locals: {}, goTo: function(){}};
      sinon.spy(res, 'goTo');
      controller.newPassword({
        we: we,
        params: { id: 100212312 },
        session: { resetPassword: true },
        isAuthenticated: function() { return true },
        user: user
      }, res);
      assert(res.goTo.called);
      assert.equal(res.goTo.firstCall.args[0], '/auth/'+user.id+'/new-password');
      done();
    });
  });
});