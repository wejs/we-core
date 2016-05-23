var assert = require('assert');
var We;

describe('lib/index.js', function () {
  before(function (done) {
    We = require('../../../lib/index.js');
    done();
  });

  it ('should delete some attrs from request and response in freeResponseMemory', function (done) {
    var req = {}
    var res = {
      locals: {
        req: true,
        regions: true,
        Model: true,
        body: true,
        layoutHtml: true
      }
    }

    We.prototype.freeResponseMemory(req, res);

    assert(!res.locals.req);
    assert(!res.locals.regions);
    assert(!res.locals.Model);
    assert(!res.locals.body);
    assert(!res.locals.layoutHtml);

    done();
  });

  describe('We instance', function(){
    var we;

    before(function(done){
      we = new We();
      we.bootstrap(done);
    })

    it('should set response type and formater with we.responses.addResponseFormater', function (done) {
      we.responses.addResponseFormater('xml', function formater(){});

      assert(we.config.responseTypes.indexOf('xml') > -1);
      assert(we.responses.formaters.xml);

      done();
    });
  });


});