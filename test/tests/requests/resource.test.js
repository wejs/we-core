var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var Chance = require('chance');
var chance = new Chance();
var _, http, we;

function postStub(creatorId) {
  return {
    title: chance.sentence({words: 5}),
    text: chance.paragraph(),
    creatorId: creatorId
  }
}

describe('resourceRequests', function() {
  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    _ = we.utils._;
    return done();
  });

  afterEach(function(done){
    we.db.models.post.truncate()
    .then(function(){
      done();
    }).catch(done);
  })

  describe('json', function() {
    describe('GET /post', function(){
      it ('should get posts list', function (done) {
        var posts = [
          postStub(),
          postStub(),
          postStub()
        ];

        we.db.models.post.bulkCreate(posts)
        .spread(function(){
          request(http)
          .get('/post')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            for (var i = 0; i < posts.length; i++) {
              assert(res.body.post[i].id);
              assert.equal(res.body.post[i].title, posts[i].title);
              assert.equal(res.body.post[i].text, posts[i].text);
            }

            assert.equal(res.body.meta.count, 3);

            done();
          });
        }).catch(done);
      });
    });

    describe('GET /post/:id', function(){
      it ('should get one post', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {
          request(http)
          .get('/post/'+p.id)
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.post.id);
            assert.equal(res.body.post.title, p.title);
            assert.equal(res.body.post.text, p.text);

            done();
          });
        }).catch(done);
      });

      it ('should return 404 to not found', function (done) {
        var info = we.log.info;
        we.log.info = function() {};
        request(http)
        .get('/post/12321313123121311231231233')
        .expect(404)
        .end(function (err, res) {
          if (err) throw err;

          assert(!res.body.post);
          we.log.info = info;
          done();
        });
      });
    });

    describe('PUT /post/:id', function(){
      it ('should update one post attr', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {

          var updateData = {
            title: 'iIIeeei'
          };
          request(http)
          .put('/post/'+p.id)
          .send(updateData)
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.post.id);
            assert.equal(res.body.post.title, updateData.title);
            assert.equal(res.body.post.text, p.text);

            done();
          });
        }).catch(done);
      });
    });

    describe('DELETE /post/:id', function(){
      it ('should delete one post', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {
          request(http)
          .delete('/post/'+p.id)
          .expect(204)
          .end(function (err, res) {
            if (err) throw err;

            assert(!res.text);

            we.db.models.post.findById(p.id)
            .then(function(ps){
              assert(!ps);
              done();
            }).catch(done);
          });
        }).catch(done);
      });
    });

    describe('POST /post', function(){
      it ('should create one resource with valid data', function (done) {
        var p = postStub();
        request(http)
        .post('/post')
        .send(p)
        .set('Accept', 'application/json')
        .expect(201)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body.post.id);
          assert.equal(res.body.post.title, p.title);
          assert.equal(res.body.post.text, p.text);

          done();
        });
      });

      it ('should return error if not set an not null attr', function (done) {
        var p = postStub();
        p.title = null;

        request(http)
        .post('/post')
        .send(p)
        .set('Accept', 'application/json')
        .expect(400)
        .end(function (err, res) {
          if (err) throw err;

          assert(!res.body.post.id);

          assert.equal(res.body.messages[0].status, 'danger');
          assert.equal(res.body.messages[0].message, 'title cannot be null');

          assert.equal(res.body.post.title, p.title);
          assert.equal(res.body.post.text, p.text);

          done();
        });
      });
    });
  });
});