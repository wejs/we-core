var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var controller, we;

describe('controllers.admin', function () {
  before(function (done) {
    controller = require('../../../server/controllers/admin.js');
    we = helpers.getWe();
    done();
  });

  it('admin.index action may set res.locals.template and run res.ok', function (done) {
    var res = { locals: {}, ok: function(){}};

    sinon.spy(res, 'ok');

    controller.index({}, res);
    assert.equal(res.locals.template, 'home/index');
    assert(res.ok.called);
    done();
  });
});