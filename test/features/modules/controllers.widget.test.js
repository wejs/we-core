var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var controller, we;

var getWidgetStub = function() {
  return {
    title: 'A widget title',
    type: 'html',
    theme: 'we-theme-site-wejs'
  }
}

describe('controllers.widget', function () {
  var user;
  before(function (done) {
    controller = require('../../../server/controllers/widget.js');
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });
  describe('controllers.widget.create', function () {
    it('create action should run res.created and set creatorId for valid data', function (done) {
      var req = {
        we: we,
        user: user,
        body: getWidgetStub()
      };
      var res = { locals: {
        theme: 'we-theme-site-wejs',
        Model: we.db.models.widget
      }, created: function(){
        assert.equal(res.locals.data.type, 'html');
        assert.equal(res.locals.data.title, 'A widget title');
        done();
      }};
      controller.create(req, res);
    });
  });

  describe('controllers.widget.sortWidgets', function () {
    it('sortWidgets action should run res.badRequest if widgets body params not is set', function (done) {
      var req = {
        method: 'POST',
        we: we,
        user: user,
        params: {},
        body: {}
      };
      var res = { locals: { }, badRequest: function(){
        done();
      }};
      controller.sortWidgets(req, res);
    });
  });
});