var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var path = require('path');
var getLogger, we;

describe('lib/log', function () {
  before(function (done) {
    getLogger = require('../../../lib/log');
    we = helpers.getWe();
    done();
  });

  it('should throw error if we not are avaible', function (done) {
    try {
      getLogger();
    } catch (e) {
      assert.equal(e.message, 'we instance is required for get logger instance');
      done();
    }
  });

  it('should return logged without config file', function (done) {
    var logger = getLogger(we);

    assert.equal(logger.transports.console.level, 'info');
    assert.equal(logger.transports.console.depth, 5);

    done();
  });

  it('should return logged with config file', function (done) {
    we.projectPath = path.resolve(__dirname, '../../testData');

    delete process.env.LOG_LV;

    var logger = getLogger(we);

    assert.equal(logger.transports.console.level, 'warn');
    assert.equal(logger.transports.console.depth, 6);

    we.projectPath = process.cwd();

    process.env.LOG_LV = 'info';

    done();
  });

  it('should throw error with error in log.js config file', function (done) {
    we.projectPath = path.resolve(__dirname, '../../testData/invalidLogConfig');

    try {
      getLogger(we);
    } catch(e) {
      assert.equal(e.message, 'Unexpected identifier');
      done();
    }
  });
});