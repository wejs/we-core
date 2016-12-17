var assert = require('assert');
var getEnv;

describe('getEnv', function () {
  before(function (done) {
    getEnv = require('../../../src/getEnv.js');
    done();
  });

  it('should return dev for unknow environment', function (done) {
    process.env.NODE_ENV = null;
    assert.equal(getEnv(), 'dev');
    process.env.NODE_ENV = 'test';
    done();
  });

  it('should return dev if --dev command option is set', function (done) {

    process.argv.push('--dev');
    assert.equal(getEnv(), 'dev');
    var index = process.argv.indexOf('--dev');
    if (index > -1) process.argv.splice(index, 1);

    done();
  });

  it('should return test if --test command option is set', function (done) {
    process.argv.push('--test');
    assert.equal(getEnv(), 'test');

    var index = process.argv.indexOf('--test');
    if (index > -1) process.argv.splice(index, 1);

    done();
  });

  it('should return prod if --prod command option is set', function (done) {
    process.argv.push('--prod');
    assert.equal(getEnv(), 'prod');

    var index = process.argv.indexOf('--prod');
    if (index > -1) process.argv.splice(index, 1);

    done();
  });

  it('should return prod if NODE_ENV=production', function (done) {
    process.env.NODE_ENV = 'production';
    assert.equal(getEnv(), 'prod');

    process.env.NODE_ENV = 'test';
    done();
  });

  it('should return prod if NODE_ENV=prod', function (done) {
    process.env.NODE_ENV = 'prod';
    assert.equal(getEnv(), 'prod');

    process.env.NODE_ENV = 'test';

    done();
  });

  it('should return test if NODE_ENV=test', function (done) {
    process.env.NODE_ENV = 'test';
    assert.equal(getEnv(), 'test');

    done();
  });

  it('should return dev if NODE_ENV=development', function (done) {
    process.env.NODE_ENV = 'development';
    assert.equal(getEnv(), 'dev');

    process.env.NODE_ENV = 'test';

    done();
  });

  it('should return dev if NODE_ENV=dev', function (done) {
    process.env.NODE_ENV = 'dev';
    assert.equal(getEnv(), 'dev');

    process.env.NODE_ENV = 'test';

    done();
  });
});