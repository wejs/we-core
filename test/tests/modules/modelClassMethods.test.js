var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we;

describe('modelClassMethods', function () {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it('Should load model class methods from plugin', function (done) {
    assert(we.db.modelClassMethods.returnModelName);
    done();
  });

  it('Should run the model classMethod in right model', function (done) {

    assert(we.db.models.hero.returnModelName(), 'hero');

    done();
  });
});