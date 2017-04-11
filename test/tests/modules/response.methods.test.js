var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var we;

describe('we.responses.methods', function () {
  var post;
  before(function (done) {
    we = helpers.getWe();
    we.db.models.post.create({
      title: 'ada asd adad  a '
    }).then(function(r){
      post = r;
      done();
    }).catch(done);
  });

  after(function (done) {
    post.destroy().then(function(){
      done();
    }).catch(done);
  });


  describe('ok', function () {
    before(function (done) { done(); });

    it('we.responses.methods.ok should run res.format and set res.locals.data', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return false } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'json',
          action: 'edit'
        },
        format: function() {
          assert.equal(res.status.firstCall.args[0], 200);
          assert.equal(res.locals.data.id, post.id);
          assert.equal(res.locals.data.title, post.title);

          done();
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
      })(post);

      assert(res.status.called);

    });

    it('we.responses.methods.ok should call res.redirect with /', function (done) {
      var req = { method: 'POST', we: we,accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
      })(post);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);

      done();
    });

    it('we.responses.methods.ok should call res.view with post record', function (done) {
      var req = { method: 'POST', we: we,accepts: function(){ return false }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          action: 'find'
        },
        redirect: function() {},
        status: function() {},
        format: function() {

          assert.equal(res.locals.data.id, post.id);
          assert.equal(res.locals.data.title, post.title);
          assert(!res.redirect.called);
          assert(res.status.called);
          assert.equal(res.status.firstCall.args[0], 200);

          done();

        },
        view: function() {}
      };
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.ok.bind({
        req: req,
        res: res,
        we: we
      })(post);

    });
  });

  describe('created', function () {
    before(function (done) { done(); });

    it('we.responses.methods.created should run res.view if is set to true skipRedirect', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
      var req = { method: 'POST', we: we, accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
      })(post);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/');
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 201);
      assert(!res.send.called);

      done();
    });

    it('we.responses.methods.created should run res.redirect with post findOne if res.locals.redirectTo is not set',
    function (done) {
      var req = { method: 'POST', we: we, paramsArray: [],accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
      })(post);

      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/post/'+post.id);
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
      var req = { method: 'POST', we: we, accepts: function(){ return true } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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

    it('we.responses.methods.updated should run res.redirect with post find redirectTo is not set',
    function (done) {
      var req = { method: 'POST', we: we, paramsArray: [], accepts: function(){ return true } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
      })(post);
      assert(!res.view.called);
      assert(res.redirect.called);
      assert.equal(res.redirect.firstCall.args[0], '/post/'+post.id);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 200);
      assert(!res.send.called);
      done();
    });
  });

  describe('deleted', function () {
    before(function (done) { done(); });

    it('we.responses.methods.deleted should run res.redirect redirectTo is set', function (done) {
      var req = {
        method: 'POST',
        we: we,
        paramsArray: [1],
        accepts: function(){ return true }
      };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
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
    it('we.responses.methods.deleted should run res.format for json responses', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return false }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'json',
          action: 'deleted'
        },
        status: function() {},
        format: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'format');
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
      assert(res.format.called);
      assert(res.format.firstCall.args[0]);
      assert(!res.format.firstCall.args[1]);
      done();
    });
  });

  describe('forbidden', function () {
    before(function (done) { done(); });

    it('we.responses.methods.forbidden should run res.format if responseType=html', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        format: function() {},
        view: function() {},
        redirect: function() {},
        addMessage: function() {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.forbidden.bind({
        req: req, res: res, we: we
      })({ message: 'hi' });
      assert(res.format.called);
      assert(res.format.firstCall.args[0]);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 403);
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

    it('we.responses.methods.notFound should run res.format if responseType=html', function (done) {

      var req = { method: 'POST', we: we, accepts: function(){ return true }  };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'json',
          __: function() {}
        },
        status: function() {},
        format: function() {},
        view: function() {},
        redirect: function() {},
        addMessage: function() {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');

      we.responses.methods.notFound.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 404);
      assert(res.format.called);

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

    it('we.responses.methods.serverError should run res.format if responseType=html', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return true } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        format: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.serverError.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(res.format.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 500);
      assert(!res.view.called);
      done();
    });
  });

  describe('badRequest', function () {
    before(function (done) { done(); });

    it('we.responses.methods.badRequest should run res.format if responseType=html', function (done) {
      var req = { method: 'POST', we: we, accepts: function(){ return true } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'html',
          __: function() {}
        },
        status: function() {},
        format: function() {},
        view: function() {},
        redirect: function() {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'redirect');
      sinon.spy(res, 'view');

      we.responses.methods.badRequest.bind({
        req: req, res: res, we: we
      })({ messages: 'hi' });
      assert(res.format.called);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      done();
    });

    // it('we.responses.methods.badRequest should run res.send if responseType=json and send only messages', function (done) {

    //   var req = { method: 'POST', we: we, accepts: function(){ return false } };
    //   var res = {
    //     locals: {
    //       Model: we.db.models.post,
    //       responseType: 'json',
    //       messages: 'hi',
    //       __: function() {}
    //     },
    //     status: function() {},
    //     send: function() {},
    //     view: function() {},
    //     redirect: function() {}
    //   };
    //   sinon.spy(res, 'send');
    //   sinon.spy(res, 'status');
    //   sinon.spy(res, 'redirect');
    //   sinon.spy(res, 'view');

    //   we.responses.methods.badRequest.bind({
    //     req: req, res: res, we: we
    //   })();
    //   assert(res.send.called);
    //   assert.equal(res.send.firstCall.args[0].messages, 'hi');
    //   assert(!res.redirect.called);
    //   assert(res.status.called);
    //   assert.equal(res.status.firstCall.args[0], 400);
    //   assert(!res.view.called);

    //   done();
    // });

    // it('we.responses.methods.badRequest should run res.send if responseType=json and send data + messages',
    // function (done) {

    //   var req = { method: 'POST', we: we, accepts: function(){ return false } };
    //   var res = {
    //     locals: {
    //       Model: we.db.models.post,
    //       model: 'post',
    //       responseType: 'json',
    //       messages: 'hi',
    //       __: function() {}
    //     },
    //     status: function() {},
    //     send: function() {},
    //     view: function() {},
    //     redirect: function() {}
    //   };
    //   sinon.spy(res, 'send');
    //   sinon.spy(res, 'status');
    //   sinon.spy(res, 'redirect');
    //   sinon.spy(res, 'view');

    //   we.responses.methods.badRequest.bind({
    //     req: req, res: res, we: we
    //   })(post);
    //   assert(res.send.called);
    //   assert.equal(res.send.firstCall.args[0].messages, 'hi');
    //   assert.equal(res.send.firstCall.args[0].post.id, post.id);
    //   assert(!res.redirect.called);
    //   assert(res.status.called);
    //   assert.equal(res.status.firstCall.args[0], 400);
    //   assert(!res.view.called);

    //   done();
    // });

    // it('we.responses.methods.badRequest should run res.send if responseType=json and send addMessage',
    // function (done) {

    //   var req = { method: 'POST', we: we, accepts: function(){ return false } };
    //   var res = {
    //     locals: {
    //       Model: we.db.models.post,
    //       model: 'post',
    //       responseType: 'json',
    //       messages: 'hi'
    //     },
    //     status: function() {},
    //     send: function() {},
    //     view: function() {},
    //     addMessage: function() {}
    //   };
    //   sinon.spy(res, 'send');
    //   sinon.spy(res, 'status');
    //   sinon.spy(res, 'addMessage');
    //   sinon.spy(res, 'view');

    //   we.responses.methods.badRequest.bind({
    //     req: req, res: res, we: we
    //   })('a error messsage');
    //   assert(res.send.called);
    //   assert.equal(res.send.firstCall.args[0].messages, 'hi');
    //   assert(res.addMessage.called);
    //   assert(res.status.called);
    //   assert.equal(res.status.firstCall.args[0], 400);
    //   assert(!res.view.called);

    //   done();
    // });
  });
  describe('queryError', function () {
    before(function (done) { done(); });

    it('we.responses.methods.queryError should parse SequelizeValidationError errors', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__, accepts: function(){ return true } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'html'
        },
        addMessage: function() {},
        status: function() {},
        format: function() {},
        redirect: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'format');
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

      assert(res.locals.validationError);
      assert(!res.redirect.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 400);
      assert(res.format.called);
      done();
    });

    it('we.responses.methods.queryError should addMessage for SequelizeDatabaseError errors', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__, accepts: function(){ return true; } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'html'
        },
        addMessage: function() {},
        status: function() {},
        format: function() {},
        view: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'addMessage');
      sinon.spy(res, 'renderPage');

      we.responses.methods.queryError.bind({
        req: req, res: res, we: we
      })({
        name: 'SequelizeDatabaseError',
        message: 'a message'
      });

      assert(res.format.called);
      assert(res.addMessage.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 500);
      done();
    });

    it('we.responses.methods.queryError should run res.send', function (done) {
      we.env = 'dev';
      var req = { method: 'POST', we: we, __: we.i18n.__, accepts: function(){ return false } };
      var res = {
        locals: {
          Model: we.db.models.post,
          model: 'post',
          responseType: 'json'
        },
        addMessage: function() {},
        status: function() {},
        format: function() {},
        view: function() {},
        renderPage: function () {}
      };
      sinon.spy(res, 'format');
      sinon.spy(res, 'status');
      sinon.spy(res, 'addMessage');
      sinon.spy(res, 'renderPage');

      we.responses.methods.queryError.bind({
        req: req, res: res, we: we
      })({
        name: 'SequelizeDatabaseError',
        message: 'a message'
      });

      assert(res.format.called);
      assert(res.addMessage.called);
      assert(res.status.called);
      assert.equal(res.status.firstCall.args[0], 500);

      we.env = 'test';
      done();
    });
  });

  describe('goTo', function () {
    before(function (done) { done(); });

    it('we.responses.methods.goTo should redirect and pass status', function (done) {

      var req = { method: 'POST', we: we, __: we.i18n.__, accepts: function(){ return true } };
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