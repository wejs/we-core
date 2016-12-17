var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var getAppBootstrapConfig, we;

describe('lib.staticConfig.getAppBootstrapConfig', function () {
  before(function (done) {
    getAppBootstrapConfig = require('../../../src/staticConfig/getAppBootstrapConfig.js');
    we = helpers.getWe();
    done();
  });

  it('should return public configurations', function (done) {
    var configs = getAppBootstrapConfig(we);

    assert.equal(configs.version, 2);
    assert.equal(configs.env, 'test');
    assert.equal(configs.client.language, 'en-us');
    assert.equal(configs.client.publicVars.dynamicLayout, false);
    assert.equal(configs.appName, 'We test');
    assert.equal(configs.locales[0], 'en-us');


    done();
  });
});