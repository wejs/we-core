var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var we;

describe('we.responses.methods', function () {
  var user;
  before(function (done) {
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });

  describe('ok', function () {
    before(function (done) { done(); });

    it('we.responses.methods.ok should send user record if passed as arguments', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          action: 'edit'
        },
        status: function() {},
        send: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      we.responses.methods.ok.bind({
        req: req,
        res: res,
        we: we
      })(user);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert.equal(res.send.firstCall.args[0].user.id, user.id);
      assert.equal(res.send.firstCall.args[0].user.displayName, user.displayName);
      assert.equal(res.send.firstCall.args[0].user.fullName, user.fullName);
      assert(res.send.called);
      done();
    });

    it('we.responses.methods.ok should call res.redirect with /', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'edit',
          redirectTo: '/'
        },
        redirect: function() {},
        status: function() {},
        send: function() {},
        view: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');

      we.responses.methods.ok.bind({
        req: req,
        res: res,
        we: we
      })(user);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);

      done();
    });


    it('we.responses.methods.ok should call res.view with user record', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'find'
        },
        redirect: function() {},
        status: function() {},
        send: function() {},
        view: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.ok.bind({
        req: req,
        res: res,
        we: we
      })(user);

      assert(res.view.called);
      assert.equal(res.view.firstCall.args[0].id, user.id);
      assert.equal(res.view.firstCall.args[0].displayName, user.displayName);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);

      done();
    });
  });

  describe('created', function () {
    before(function (done) { done(); });

    it('we.responses.methods.created should run res.view if is set to true skipRedirect', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'create',
          skipRedirect: true
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.created.bind({
        req: req,
        res: res,
        we: we
      })();
      assert(res.view.called);
      assert(res.view.firstCall.args[0]);
      assert(!res.view.firstCall.args[0].id);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 201);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.created should run res.redirect res.locals.redirectTo is set', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'edit',
          redirectTo: '/'
        },
        redirect: function() {},
        status: function() {},
        send: function() {},
        view: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');

      we.responses.methods.created.bind({
        req: req,
        res: res,
        we: we
      })(user);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 201);
      assert(!res.send.called);

      done();
    });

    it('we.responses.methods.created should run res.redirect with user findOne if res.locals.redirectTo is not set',
    function (done) {
      var req = { method: 'POST', we: we, paramsArray: [] };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'create'
        },
        redirect: function() {},
        status: function() {},
        send: function() {},
        view: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.created.bind({
        req: req, res: res, we: we
      })(user);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/user/'+user.id);
      assert(!res.view.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 201);
      assert(!res.send.called);

      done();
    });
  });

  describe('updated', function () {
    before(function (done) { done(); });

    it('we.responses.methods.updated should run res.redirect redirectTo is set', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'update',
          redirectTo: '/aurl'
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.updated.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/aurl');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.updated should run res.redirect with user find redirectTo is not set',
    function (done) {
      var req = { method: 'POST', we: we, paramsArray: [] };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'update'
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.updated.bind({
        req: req, res: res, we: we
      })(user);
      assert(!res.view.called);
      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/user/'+user.id);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.updated should run res.send for json response',
    function (done) {
      var req = { method: 'POST', we: we, paramsArray: [] };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          action: 'update',
          data: user
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.updated.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].user.id, user.id);
      assert.equal(res.send.firstCall.args[0].user.displayName, user.displayName);
      done();
    });
  });

  describe('deleted', function () {
    before(function (done) { done(); });

    it('we.responses.methods.deleted should run res.redirect redirectTo is set', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          action: 'deleted',
          redirectTo: '/aurl'
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.deleted.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/aurl');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 204);
      assert(!res.send.called);
      done();
    });
    it('we.responses.methods.deleted should run res.send for json responses', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          action: 'deleted'
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.deleted.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 204);
      assert(res.send.called);
      assert(!res.send.firstCall.args[0]);
      done();
    });
  });

  describe('forbidden', function () {
    before(function (done) { done(); });

    it('we.responses.methods.forbidden should run res.view if responseType=html', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.forbidden.bind({
        req: req, res: res, we: we
      })({ message: 'hi' });
      assert(res.view.called);
      assert.equal(res.view.firstCall.args[0].message, 'hi');
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 403);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.forbidden should run res.send only with messages if model not is set', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: null,
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.forbidden.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 403);

      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');

      done();
    });

    it('we.responses.methods.forbidden should run res.send with data', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.forbidden.bind({
        req: req, res: res, we: we
      })(user);
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 403);

      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');
      assert.equal(res.send.firstCall.args[0].user.id, user.id);

      done();
    });
  });

  describe('notFound', function () {
    var info;

    before(function (done) {
      info = we.log.info;
      we.log.info = function() {};

      done();
    });

    after(function (done) {
      we.log.info = info;
      done();
    });

    it('we.responses.methods.notFound should run res.view if responseType=html', function (done) {

      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.notFound.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(res.view.called);
      assert.equal(res.view.firstCall.args[0].messages, 'hi');
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 404);
      assert(!res.send.called);

      done();
    });

    it('we.responses.methods.notFound should run res.view if responseType=html and set data={}', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.notFound.bind({
        req: req, res: res, we: we
      })();
      assert(res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 404);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.notFound should run res.send if responseType!=html', function (done) {
      var req = { method: 'GET', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.notFound.bind({
        req: req, res: res, we: we
      })(user);
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 404);

      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');

      assert.equal(res.send.firstCall.args[0].id, user.id);
      done();
    });
  });

  describe('serverError', function () {
    var error;

    before(function (done) {
      error = we.log.error;
      we.log.error = function() {};

      done();
    });

    after(function (done) {
      we.log.error = error;
      done();
    });

    it('we.responses.methods.serverError should run res.view if responseType=html', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.serverError.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(res.view.called);
      assert.equal(res.view.firstCall.args[0].messages, 'hi');
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 500);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.serverError should run res.send if responseType!=html', function (done) {
      we.env = 'dev';
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.serverError.bind({
        req: req, res: res, we: we
      })();
      assert(!res.view.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 500);

      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');
      we.env = 'test';
      done();
    });
  });

  describe('badRequest', function () {
    before(function (done) { done(); });

    it('we.responses.methods.badRequest should run res.view if responseType=html', function (done) {
      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.badRequest.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(res.view.called);
      assert.equal(res.view.firstCall.args[0].messages, 'hi');
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(!res.send.called);
      done();
    });

    it('we.responses.methods.badRequest should run res.send if responseType=json and send only messages', function (done) {

      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.badRequest.bind({
        req: req, res: res, we: we
      })();
      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(!res.view.called);

      done();
    });

    it('we.responses.methods.badRequest should run res.send if responseType=json and send data + messages',
    function (done) {

      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          messages: 'hi',
          __: function() {}
        },
        status: function() {},
        send: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.badRequest.bind({
        req: req, res: res, we: we
      })(user);
      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');
      assert.equal(res.send.firstCall.args[0].user.id, user.id);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(!res.view.called);

      done();
    });

    it('we.responses.methods.badRequest should run res.send if responseType=json and send addMessage',
    function (done) {

      var req = { method: 'POST', we: we };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json',
          messages: 'hi'
        },
        status: function() {},
        send: function() {},
        view: function() {},
        addMessage: function() {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'addMessage');
      sinon.spy(res, 'view');

      we.responses.methods.badRequest.bind({
        req: req, res: res, we: we
      })('a error messsage');
      assert(res.send.called);
      assert.equal(res.send.firstCall.args[0].messages, 'hi');
      assert(res.addMessage.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(!res.view.called);

      done();
    });
  });
  describe('queryError', function () {
    before(function (done) { done(); });

    it('we.responses.methods.queryError should parse SequelizeValidationError errors', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__ };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html'
        },
        addMessage: function() {},
        status: function() {},
        send: function() {},
        redirect: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'renderPage');

      we.responses.methods.queryError.bind({
        req: req, res: res, we: we
      })({
        name: 'SequelizeValidationError',
        errors: [{
          path: '/', type: 'error', message: 'a message'
        }]
      });

      assert(res.renderPage.called);
      assert(res.locals.validationError);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(res.send.called);
      done();
    });

    it('we.responses.methods.queryError should addMessage for SequelizeDatabaseError errors', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__ };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'html'
        },
        addMessage: function() {},
        status: function() {},
        send: function() {},
        view: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'addMessage');
      sinon.spy(res, 'renderPage');

      we.responses.methods.queryError.bind({
        req: req, res: res, we: we
      })({
        name: 'SequelizeDatabaseError',
        message: 'a message'
      });

      assert(res.renderPage.called);
      assert(res.addMessage.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(res.send.called);
      done();
    });

    it('we.responses.methods.queryError should run res.send', function (done) {
      we.env = 'dev';
      var req = { method: 'POST', we: we, __: we.i18n.__ };
      var res = {
        locals: {
          Model: we.db.models.user,
          model: 'user',
          responseType: 'json'
        },
        addMessage: function() {},
        status: function() {},
        send: function() {},
        view: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'send');
      sinon.spy(res, 'status');
      sinon.spy(res, 'addMessage');
      sinon.spy(res, 'renderPage');

      we.responses.methods.queryError.bind({
        req: req, res: res, we: we
      })({
        name: 'SequelizeDatabaseError',
        message: 'a message'
      });

      assert(res.send.called);
      assert(res.send.firstCall.args[0]);
      assert(res.addMessage.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(!res.renderPage.called);

      we.env = 'test';
      done();
    });
  });

  describe('goTo', function () {
    before(function (done) { done(); });

    it('we.responses.methods.goTo should redirect and pass status', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__ };
      var res = {
        locals: {},
        moveLocalsMessagesToFlash: function(){},
        redirect: function() {}
      };
      sinon.spy(res, 'redirect');

      we.responses.methods.goTo.bind({
        req: req, res: res, we: we
      })(302, '/hi');

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], 302);
      assert.equal(res.redirect.firstCall.args[1], '/hi');

      done();
    });
  });
});