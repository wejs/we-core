const assert = require('assert'),
      request = require('supertest'),
      helpers = require('we-test-tools').helpers;

let _, http, we;

describe('routes', function() {
  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    _ = we.utils._;
    return done();
  });

  describe('json', function() {
    describe('GET /', function(){
      it ('should return 200', function (done) {

        request(http)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body.messages);

          done();
        });

      });
    });
  });

  describe('public folders', function(){
    describe('GET /public/project/images/logo.png', function(){
      it ('should return 200', function (done) {

        request(http)
        .get('/public/project/images/logo.png')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body);
          assert(!res.text);
          assert.equal(res.headers['content-type'], 'image/png');

          done();
        });

      });
    });
  })
});