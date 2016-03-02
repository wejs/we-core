var assert = require('assert');
var path = require('path');
var helpers = require('we-test-tools').helpers;
var npmf = path.resolve(process.cwd(), 'node_modules');
var we;

describe('modulePluginManager', function () {
  var pluginManager;

  before(function (done) {
    we = helpers.getWe();
    pluginManager = we.pluginManager;
    done();
  });

  it('pluginManager.isPlugin should return false for async and moment', function (done) {
    assert.equal(false, pluginManager.isPlugin(npmf+'/async'));
    assert.equal(false, pluginManager.isPlugin(npmf+'/moment'));
    assert.equal(false, pluginManager.isPlugin('invalid string'));
    done();
  });

  it('pluginManager.isPlugin should return true for we-plugin-form', function (done) {
    assert.equal(true, pluginManager.isPlugin(npmf+'/we-plugin-form'));
    done();
  });

  it('pluginManager.getPluginNames should return plugin names list', function (done) {
    var names = pluginManager.getPluginNames();
    assert(names.length > 1);
    assert(names.indexOf('project')>-1);
    assert(names.indexOf('we-plugin-form')>-1) ;
    done();
  });

});
