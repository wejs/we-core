var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;

describe('imageFeature', function () {
  var salvedImage;

  before(function (done) {
    http = helpers.getHttp();
    // upload one stub image:
    request(http)
    .post('/api/v1/image')
    .attach('image', stubs.getImageFilePath())
    .end(function (err, res) {
      salvedImage = res.body.image[0];
      done(err);
    });
  }); 

  describe('find', function () {
    it('get /api/v1/image route should find one image', function(done){ 
      request(http)
      .get('/api/v1/image')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.image);
        assert( _.isArray(res.body.image) , 'image not is array');
        assert.equal(res.body.image[0].id, salvedImage.id, 'first image returned from find dont are the salved image');
        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {
    // file upload and creation is slow then set to 300
    this.slow(300);

    it('post /api/v1/image create one image record', function(done){ 
      request(http)
      .post('/api/v1/image')
      .attach('image', stubs.getImageFilePath())
      .end(function (err, res) {
        assert.equal(201, res.status);
        assert(res.body.image);
        assert(res.body.image[0].mime);
        assert(res.body.image[0].width);
        assert(res.body.image[0].height);

        done();
      });
    });
    
  });  

  describe('findOne', function () {
    it('get /api/v1/image/:name should return one image file', function(done){ 
      request(http)
      .get('/api/v1/image/' + salvedImage.name)
      .attach('image', stubs.getImageFilePath())
      .end(function (err, res) {

        assert.equal(200, res.status);
        assert.equal(res.type, salvedImage.mime);
        assert(res.body);

        done();
      });
    });
  });
 
  describe('remove', function () {
    it('delete /api/v1/image/:name should delete one image file');
  });
});
