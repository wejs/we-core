const assert = require('assert'),
      request = require('supertest'),
      path = require('path'),
      Chance = require('chance'),
      We = require('../../../src'),
      chance = new Chance();

let we, _, http;

describe('resource.pluralized', function(){

// prepare we.js core and load app features with pluralization:
before(function (callback) {
  this.slow(100);

  we = new We({
    bootstrapMode: 'test'
  });

  we.bootstrap({
    // disable access log
    enableRequestLog: false,
    router: {
      pluralize: true
    },
    port: 9988,
    i18n: {
      directory: path.resolve(process.cwd(), 'config/locales'),
      updateFiles: true,
      locales: ['en-us']
    },
    themes: {}
  }, callback);
});

// start the server:
before(function (callback) {
  we.startServer(callback);
});

before(function (done) {
  http = we.http;
  _ = we.utils._;
  return done();
});

function postStub(creatorId) {
  return {
    title: chance.sentence({words: 5}),
    text: chance.paragraph(),
    creatorId: creatorId
  };
}

describe('resourceRequests', function() {
  afterEach(function(done){
    var sequelize = we.db.defaultConnection;

    sequelize.transaction(function(t) {
      var options = { raw: true, transaction: t };

      return sequelize
        .query('SET FOREIGN_KEY_CHECKS = 0', options)
        .then(function() {
          return sequelize.query('delete from posts_tags', options);
        })
        .then(function() {
          return sequelize.query('delete from tags', options);
        })
        .then(function() {
          return sequelize.query('delete from posts', options);
        })
        .then(function() {
          return sequelize.query('SET FOREIGN_KEY_CHECKS = 1', options);
        });
    })
    .done(function() {
      done();
    });

  });
  describe('json', function() {
    describe('GET /posts', function(){
      it ('should get posts list', function (done) {

        var posts = [
          postStub(),
          postStub(),
          postStub()
        ];

        we.db.models.post.bulkCreate(posts)
        .spread(function() {
          request(http)
          .get('/posts')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.error('res.text>',res.text);
              throw err;
            }

            for (var i = 0; i < posts.length; i++) {
              assert(res.body.post[i].id);
            }

            assert.equal(res.body.meta.count, 3);

            done();
          });
        })
        .catch(done);
      });

      it ('/posts/count should get posts count', function (done) {
        var posts = [
          postStub(),
          postStub(),
          postStub()
        ];

        we.db.models.post.bulkCreate(posts)
        .spread(function() {
          request(http)
          .get('/posts/count')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.error('res.text>',res.text);
              throw err;
            }

            assert(res.body.count, `Count should be present in response`);
            assert.equal(res.body.count, 3, `Count should be 3`);

            done();
          });
        })
        .catch(done);
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
          .get('/posts?title='+posts[1].title)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.body.post.length, 1);
            assert(res.body.post[0].id, posts[1].title);
            assert.equal(res.body.post[0].title, posts[1].title);
            assert.equal(res.body.post[0].text, posts[1].text);

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
          .get('/posts?text='+searchText)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            assert.equal(res.body.post.length, 2);

            res.body.post.forEach(function(p){
              assert(p.text.indexOf(searchText) >-1);
            })

            assert.equal(res.body.meta.count, 2);

            done();
          });
        }).catch(done);
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
          .get('/posts?q='+searchText+','+searchText2)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;
            assert.equal(res.body.post.length, 2);
            assert.equal(res.body.meta.count, 2);

            done();
          });
        }).catch(done);
      });
    });

    describe('GET /posts/:id', function(){
      it ('should get one post', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {
          request(http)
          .get('/posts/'+p.id)
          .set('Accept', 'application/json')
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
        .get('/posts/123213131')
        .expect(404)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) throw err;

          assert(!res.body.post);
          we.log.info = info;
          done();
        });
      });
    });

    describe('PUT /posts/:id', function(){
      it ('should update one post attr', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {

          var updateData = {
            title: 'iIIeeei'
          };
          request(http)
          .put('/posts/'+p.id)
          .set('Accept', 'application/json')
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

    describe('DELETE /posts/:id', function(){
      it ('should delete one post', function (done) {
        we.db.models.post.create(postStub())
        .then(function (p) {
          request(http)
          .delete('/posts/'+p.id)
          .set('Accept', 'application/json')
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

    describe('POST /posts', function(){
      it ('should create one resource with valid data', function (done) {
        var p = postStub();
        request(http)
        .post('/posts')
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
        .post('/posts')
        .send(p)
        .set('Accept', 'application/json')
        .expect(400)
        .end(function (err, res) {
          if (err) throw err;

          // assert(!res.body.post.id);

          assert.equal(res.body.messages[0].status, 'danger');
          assert.equal(res.body.messages[0].message, 'title cannot be null');

          done();
        });
      });
    });
  });
});

}); // end resource.pluralized