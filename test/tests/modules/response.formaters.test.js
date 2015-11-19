var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var we;

describe('we.responses.formaters', function () {
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

  describe('html', function () {
    it('we.responses.formaters.html should run res.renderPage with req, res, and data', function (done) {
      var req = { my: 'req' };
      var res = {
        renderPage: function(req1, res1, data1) {
          assert.equal(req1, req);
          assert.equal(data1, data);
        }
      };
      sinon.spy(res, 'renderPage');
      var data = { i: 'am data'};

      we.responses.formaters.html(data, req, res);

      assert(res.renderPage.called);
      done();
    });


    it('we.responses.formaters.modal should run req.we.view.renderTemplate', function (done) {
      var req = {
        we: {
          view: {
            renderTemplate: function(tpl, theme, lc) {
              assert.equal(tpl, res.locals.template);
              assert.equal(theme, res.locals.theme);
              assert.equal(lc, res.locals);
            }
          }
        }
      };
      var res = {
        locals: {
          template: 'testTemplate',
          theme: 'test'
        }
      };
      sinon.spy(req.we.view, 'renderTemplate');
      we.responses.formaters.modal({}, req, res);
      assert(req.we.view.renderTemplate.called);
      done();
    });
  });
});