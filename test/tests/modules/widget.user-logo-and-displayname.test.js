var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var widget, we, projectPath = process.cwd();

describe('widget.user-logo-and-displayname', function () {
  before(function (done) {
    we = helpers.getWe();
    widget = require('../../../server/widgets/user-logo-and-displayname')(
      projectPath, we.class.Widget
    );
    done();
  });

  describe('widget.checkIfIsValidContext', function () {
    it('widget.checkIfIsValidContext return true for user-2', function (done) {
      var result = widget.checkIfIsValidContext('user-2');
      assert(result);
      done();
    });

    it('widget.checkIfIsValidContext return false for wrong-2', function (done) {
      var result = widget.checkIfIsValidContext('wrong-2');
      assert.equal(result, false);
      done();
    });
  });

  describe('widget.isAvaibleForSelection', function () {
    it('widget.isAvaibleForSelection should return false if req.header dont are set', function (done) {

      var req = {};
      assert.equal(widget.isAvaibleForSelection(req), false);

      done();
    });

    it('widget.isAvaibleForSelection should return false if dont are in user context', function (done) {

      var req = {
        header: function() {
          return 'wrong-1';
        }
      };
      assert.equal(widget.isAvaibleForSelection(req), false);

      done();
    });

    it('widget.isAvaibleForSelection should return true if are in user context', function (done) {

      var req = {
        header: function() {
          return 'user-1';
        }
      };
      assert(widget.isAvaibleForSelection(req));

      done();
    });

  });

  describe('widget.beforeSave', function () {
    it('widget.beforeSave should run next callback with valid context', function (done) {

      var next = function next(err) {
        assert(!err);

        done();
      };

      var req = {
        body: {
          context: 'user-1'
        }
      };
      var res = {
        locals: {}
      }

      widget.beforeSave(req, res, next);
    });

    it('widget.beforeSave should run next(err) callback with invalid context', function (done) {

      var next = function next(err) {
        assert(err);

        done();
      };

      var req = {
        body: {
          context: 'wrong-1'
        }
      };
      var res = {
        locals: {
          __: function() {}
        }
      }

      widget.beforeSave(req, res, next);
    });
  });

  describe('widget.renderVisibilityField', function () {
    it('widget.renderVisibilityField should return context fields', function (done) {

      var context = 'user-1';
      var req = {};
      var res = {
        locals: {
          __: function() {}
        }
      };

      var html = widget.renderVisibilityField(null, context, req, res);

      assert(html);

      // TODO Add better checks here
      assert(html.indexOf('value="in-context"') > 1);

      done();
    });
  });
});