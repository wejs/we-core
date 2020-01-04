const assert = require('assert');
const helpers = require('we-test-tools').helpers;
let getLogger, we;

describe('lib/log', function () {
  before(function (done) {
    getLogger = require('../../../src/log');
    we = helpers.getWe();

    we.config.log.level = 'info';

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

  it('should return logger without config file', function (done) {
    const logger = getLogger(we);

    assert.equal(logger.transports[0].level, 'info');

    done();
  });
});