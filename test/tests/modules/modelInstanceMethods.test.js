var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we;

describe('modelInstanceMethods', function () {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it('Should load model instanceMethods from plugin', function (done) {
    assert(we.db.modelInstanceMethods.returnModelId);
    done();
  });

  it('Should run the model instanceMethod in right model', function (done) {
    var hs = {
      name: 'Iron Man',
      history: 'Iron Man (Tony Stark) is a fictional superhero appearing in American comic '+
        'books published by Marvel Comics,'+
        ' as well as its associated media. The character was created by writer and editor Stan Lee,'+
        ' developed by scripter Larry Lieber, and designed by artists Don Heck and Jack Kirby. '+
        'He made his first appearance in Tales of Suspense #39 (cover dated March 1963)'
    };

    we.db.models.hero.create(hs)
    .then(function(h) {
      assert.equal(h.returnModelIdiii(), h.id);

      done();
    })
    .catch(done);
  });
});