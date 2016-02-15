var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var widget, we, projectPath = process.cwd();

describe('widget.passport-strategies', function () {
  before(function (done) {
    we = helpers.getWe();
    widget = require('../../../server/widgets/passport-strategies')(
      projectPath, we.class.Widget
    );
    done();
  });

  describe('widget.viewMiddleware', function () {
    it('widget.viewMiddleware should skip if req.we.config.passport is not set', function (done) {
      var oldCfg = we.config.passport;
      we.config.passport = null;
      var req = {
        we: we,
        isAuthenticated: function() {}
      }
      sinon.spy(req, 'isAuthenticated');
      var wR = {};
      widget.viewMiddleware(wR , req, {}, function(){
        assert(!wR.strategies);
        assert(!req.isAuthenticated.called);
        we.config.passport = oldCfg;
        done();
      });
    });

    it('widget.viewMiddleware should skip if isAuthenticated'
      // ,
      // function (done) {
      //   var req = {
      //     we: we,
      //     isAuthenticated: function() { return true; }
      //   }
      //   sinon.spy(req, 'isAuthenticated');
      //   var wR = {};

      //   widget.viewMiddleware(wR , req, {}, function(){
      //     assert(!wR.strategies);
      //     assert(req.isAuthenticated.called);
      //     done();
      //   });
      // }
    );

    it('widget.viewMiddleware should set widget.strategies if not isAuthenticated', function (done) {
      var req = {
        we: we,
        isAuthenticated: function() { return false; }
      }
      sinon.spy(req, 'isAuthenticated');
      var wR = {};

      widget.viewMiddleware(wR , req, {}, function(){
        assert(wR.strategies);
        assert.equal(wR.strategies, we.config.passport.strategies);
        assert(req.isAuthenticated.called);
        done();
      });
    });
  });
});