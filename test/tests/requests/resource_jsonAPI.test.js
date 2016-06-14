var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var Chance = require('chance');
var chance = new Chance();
var _, http, we;

function postStub (creatorId, jsonAPI) {
  if (jsonAPI) {
    return {
      attributes: {
        title: chance.sentence({words: 5}),
        text: chance.paragraph(),
        creatorId: creatorId
      },
      relationships: {
        creator: [ { id: creatorId, type: 'user '}]
      }
    }
  } else {
    return {
      title: chance.sentence({words: 5}),
      text: chance.paragraph(),
      creatorId: creatorId
    }
  }
}

describe('resourceRequests_jsonAPI', function() {
  var su;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    _ = we.utils._;
    return done();
  });

  before(function(done) {
    we.db.models.user.create({
      displayName: 'Testonildo'
    })
    .then(function(u) {
      su = u
      return u
    })
    .nodeify(done)
  })

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
          postStub(su.id),
          postStub(su.id),
          postStub(su.id)
        ];

        we.db.models.post.bulkCreate(posts)
        .spread(function(){
          request(http)
          .get('/post')
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.log('res.body>', res.body)
              throw err;
            }

            assert(res.body.data)
            assert(_.isArray(res.body.data) )

            for (var i = 0; i < posts.length; i++) {
              var p = posts[i]

              assert(res.body.data[i].relationships)
              assert(res.body.data[i].attributes)

              assert(res.body.data[i].id)
              assert(res.body.data[i].id, p.id)

              assert.equal(res.body.data[i].attributes.title, p.title)
              assert.equal(res.body.data[i].attributes.text, p.text)
            }

            assert.equal(res.body.meta.count, 3);

            done();
          });
        }).catch(done);
      });

      it ('should search for posts by title', function (done) {
        var posts = [
          postStub(),
          postStub(),
          postStub()
        ];

        we.db.models.post.bulkCreate(posts)
        .spread(function(){
          request(http)
          .get('/post?title='+posts[1].title)
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.body.data.length, 1);
            assert(res.body.data[0].id, posts[1].title);
            assert(res.body.data[0].type, 'post');
            assert.equal(res.body.data[0].attributes.title, posts[1].title);
            assert.equal(res.body.data[0].attributes.text, posts[1].text);

            assert.equal(res.body.meta.count, 1);

            done();
          });
        }).catch(done);
      });


      it ('should search for posts by text', function (done) {
        var posts = [
          postStub(),
          postStub(),
          postStub(),
          postStub()
        ];

        var searchText = ' mussum ipsum';

        posts[1].text += searchText;
        posts[2].text += searchText;

        we.db.models.post.bulkCreate(posts)
        .spread(function(){
          request(http)
          .get('/post?text='+searchText)
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.body.data.length, 2);

            res.body.data.forEach(function(p){
              assert.equal(p.type, 'post')
              assert(p.attributes.text.indexOf(searchText) >-1)
            })

            assert.equal(res.body.meta.count, 2)

            done()
          });
        })
        .catch(done)
      });

      it ('should search for posts by text with and and inTitleAndText, orWithComaParser search in q param', function (done) {
        var posts = [
          postStub(),
          postStub(),
          postStub(),
          postStub()
        ];

        var searchText = ' mussum ipsum';
        var searchText2 = '2222m ipsum';

        posts[1].title = searchText;
        posts[1].text = searchText;

        posts[2].title = searchText2;
        posts[2].text = searchText2;

        we.db.models.post.bulkCreate(posts)
        .spread(function(){
          request(http)
          .get('/post?q='+searchText+','+searchText2)
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.log('res.text>', res.text)
              throw err
            }

            assert.equal(res.body.data.length, 2);
            assert.equal(res.body.meta.count, 2);

            done();
          });
        }).catch(done);
      });
    });

    describe('GET /post/:id', function(){
      it ('should get one post', function (done) {
        we.db.models.post.create(postStub(su.id))
        .then(function (p) {
          request(http)
          .get('/post/'+p.id)
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.data.id);
            assert.equal(res.body.data.id, p.id);
            assert.equal(res.body.data.type, 'post');

            assert.equal(res.body.data.attributes.title, p.title);
            assert.equal(res.body.data.attributes.text, p.text);

            done();
          });
        })
        .catch(done);
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
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert(res.body.data.id);
            assert.equal(res.body.data.attributes.title, updateData.title);
            assert.equal(res.body.data.attributes.text, p.text);

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
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
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
        var p = postStub(null, true);
        request(http)
        .post('/post')
        .send(p)
        .set('Content-Type', 'application/vnd.api+json')
        .set('Accept', 'application/vnd.api+json')
        .expect(201)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body.data.id);
          assert.equal(res.body.data.type, 'post');
          assert.equal(res.body.data.attributes.title, p.attributes.title);
          assert.equal(res.body.data.attributes.text, p.attributes.text);

          done();
        });
      });

      it ('should create one resource with valid data and JSONApi post data', function (done) {
        var p = postStub();
        request(http)
        .post('/post')
        .send(p)
        .set('Content-Type', 'application/vnd.api+json')
        .set('Accept', 'application/vnd.api+json')
        .expect(201)
        .end(function (err, res) {
          if (err) {
            console.log('res.text>', res.text)
            throw err
          }

          assert(res.body.data.id);
          assert.equal(res.body.data.type, 'post');
          assert.equal(res.body.data.attributes.title, p.title);
          assert.equal(res.body.data.attributes.text, p.text);

          done();
        });
      });

      it ('should return error if not set an not null attr', function (done) {
        var p = postStub();
        p.title = null;

        request(http)
        .post('/post')
        .send(p)
        .set('Content-Type', 'application/vnd.api+json')
        .set('Accept', 'application/vnd.api+json')
        .expect(400)
        .end(function (err, res) {
          if (err) throw err;

          assert(!res.body.data.id);

          assert.equal(res.body.meta.messages[0].status, 'danger');
          assert.equal(res.body.meta.messages[0].message, 'title cannot be null');

          assert.equal(res.body.data.attributes.title, p.title);
          assert.equal(res.body.data.attributes.text, p.text);

          done();
        });
      });
    });
  });
});