var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var http;

describe('imageFeature', function () {
  before(function (cb) {
    http = helpers.getHttp();

    cb();
  }); 

  // describe('find', function () {
  //   it('get /api/v1/image route should exists', function(done){ 
  //     request(http)
  //     .get('/api/v1/image')
  //     .end(function (err, res) {
  //       assert.equal(200, res.status);
  //       assert(res.body.image);
  //       assert(res.body.meta);

  //       done();
  //     });
  //   });
  // })

  describe('create', function () {
    it('post /api/v1/image create one image record', function(done){ 
      request(http)
      .post('/api/v1/image')
      .attach('image', stubs.getImageFilePath())
      .end(function (err, res) {
        assert.equal(201, res.status);
        assert(res.body.image);
        done();
      });
    });
  });  
});
