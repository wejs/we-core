var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we;

describe('router.alias', function () {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it('should load and cache all alias in initialize', function (done) {
    we.db.models.urlAlias.create({
      alias: '/my',
      target: '/user/1'
    }).then(function (alias){
      assert(alias);
      we.router.alias.initialize(we, function (err){
        if (err) throw err;
        assert(we.router.alias.cache['/user/1']);
        assert.equal(we.router.alias.cache['/user/1'].id, alias.id);

        done();
      });
    }).catch(done);
  });

  // it('should load and cache all alias in initialize', function (done) {

  // });

});