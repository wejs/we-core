var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var we;

describe('modelHooks', function () {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it('Should load model hooks from plugin', function (done) {
    assert(we.db.modelHooks.logHero);
    done();
  });

  it('Should run the model hook in rigth model hook', function (done) {
    var info = we.log.info;
    var called = false;
    var hs = {
      name: 'Iron Man',
      history: 'Iron Man (Tony Stark) is a fictional superhero appearing in American comic '+
        'books published by Marvel Comics,'+
        ' as well as its associated media. The character was created by writer and editor Stan Lee,'+
        ' developed by scripter Larry Lieber, and designed by artists Don Heck and Jack Kirby. '+
        'He made his first appearance in Tales of Suspense #39 (cover dated March 1963)'
    };

    we.log.info = function(x, record) {
      called = true;
      assert.equal('Hero!', x);
      assert.equal(record.name, hs.name);
      assert.equal(record.history, hs.history);
    }

    we.db.models.hero.create(hs)
    .then(function() {
      assert(called);

      we.log.info = info;

      done();
    })
    .catch(done);
  });
});