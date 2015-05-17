var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;
var db;

describe('imageFeature', function () {
  var salvedImage, salvedUser;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    // upload one stub image:
    request(http)
    .post('/api/v1/image')
    .attach('image', stubs.getImageFilePath())
    .end(function (err, res) {
      if(err) return done(err);
      salvedImage = res.body.image[0];
      done(err);
    });
  });

  describe('find', function () {
    it('get /api/v1/image route should find one image', function(done){
      request(http)
      .get('/api/v1/image')
      .end(function (err, res) {
        if(err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.image);
        assert( _.isArray(res.body.image) , 'image not is array');

        assert( res.body.image.length > 0);

        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {
    // file upload and creation is slow then set to 300
    this.slow(300);

    it('post /api/v1/image create one image record', function(done) {
      request(http)
      .post('/api/v1/image')
      .attach('image', stubs.getImageFilePath())
      .end(function (err, res) {
        if(err) return done(err);

        assert.equal(201, res.status);
        assert(res.body.image);
        assert(res.body.image[0].mime);
        assert(res.body.image[0].width);
        assert(res.body.image[0].height);

        done();
      });
    });


    it('db.models.image.create should create one image record with creator', function(done) {
      db = helpers.getDB();
      var userStub = stubs.userStub();
      var imageDataStub = stubs.imageDataStub();

      db.models.user.create(userStub).done(function(err, user) {
        if(err) throw new Error(err);

        //imageDataStub.creator = user.id;
        db.models.image.create(imageDataStub).done(function(err, image) {
          if(err) throw new Error(err);
          image.setCreator(user).done(function(){
            image.fetchAssociatedIds(function(err) {
              if(err) throw new Error(err);
              done();
            });
          })
        });
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

  describe('cropImage', function () {
    it('post /api/v1/image-crop/:imageId should crop one image', function(done){
      request(http)
      .post('/api/v1/image-crop/' + salvedImage.id)
      .send({
        h: 200, w: 200,
        x: 0, x2: 200,
        y: 0, y2: 200
      }).end(function (err, res) {
        assert.equal(200, res.status);
        assert.equal(res.type, 'application/json');
        assert(res.body);

        assert.equal(res.body.image.width, 200);
        assert.equal(res.body.image.height, 200);

        done();
      });
    });

  });

  describe('remove', function () {
    it('delete /api/v1/image/:name should delete one image file');
  });
});
