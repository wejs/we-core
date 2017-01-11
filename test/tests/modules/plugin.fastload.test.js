const assert = require('assert'),
   helpers = require('we-test-tools').helpers;

let we;

describe('plugin.fastload.unit', function() {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it('Should load the orWithMinusParser search parser', function() {
    assert(we.router.search.parsers.orWithMinusParser);
  });

  it('Should load the inNameAndDescription search target', function() {
    assert(we.router.search.targets.inNameAndDescription);
  });

  it('Should load the dog controller', function() {
    assert(we.controllers.dog);
  });

  it('Should load giveVaccine modelHooks', function() {
    assert(we.db.modelHooks.giveVaccine);
  });

  it('Should load bark modelInstanceMethod', function() {
    assert(we.db.modelInstanceMethods.bark);
  });

  it('Should load jump modelClassMethod', function() {
    assert(we.db.modelClassMethods.jump);
  });

  it('Should load dog model config and model', function(){
    assert(we.db.modelsConfigs.dog);
    assert(we.db.models.dog);
    assert(we.db.models.dog.jump);
  });
});