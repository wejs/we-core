const assert = require('assert'),
      request = require('supertest'),
      helpers = require('we-test-tools').helpers,
      Chance = require('chance'),
      chance = new Chance();

let _, http, we;

function postStub (creatorId, jsonAPI) {
  if (jsonAPI) {
    return {
      data: {
        attributes: {
          title: chance.sentence({words: 5}),
          text: chance.paragraph(),
          creatorId: creatorId
        },
        relationships: {
          creator: [ { id: creatorId, type: 'user '}]
        }
      }
    };
  } else {
    return {
      title: chance.sentence({words: 5}),
      text: chance.paragraph(),
      creatorId: creatorId,
      tags: [{
        text: chance.word(),
      }, {
        text: chance.word()
      }]
    };
  }
}

describe('resourceRequests_jsonAPI', function() {
  let su;

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
      su = u;
      return u;
    })
    .nodeify(done);
  });

  afterEach(function(done){
    let sequelize = we.db.defaultConnection;

    sequelize.transaction(function(t) {
      let options = { raw: true, transaction: t };

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
      return null;
    });

  });

  describe('json', function() {
    describe('GET /post', function() {
      it ('should get posts list formated with jsonAPI', function (done) {
        let posts = [
          postStub(su.id),
          postStub(su.id),
          postStub(su.id)
        ];

        let postsByTitle = {};
        posts.forEach(function(p){
          postsByTitle[p.title] = p;
        });

        we.utils.async.eachSeries(posts, function(p, next) {
          we.db.models.post
          .create(p, {
            include: [{
              model: we.db.models.tag,
              as: 'tags'
            }]
          })
          .then(function() {
            next();
            return null;
          })
          .catch(next);
        }, function(err) {
          if (err) return done(err);

          request(http)
          .get('/post')
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              console.log('res.body>', res.body);
              throw err;
            }

            assert(res.body.data);
            assert(_.isArray(res.body.data) );

            res.body.data.forEach(function (p) {

              assert(p.relationships);
              assert(p.attributes);
              assert(p.id);

              let pn = postsByTitle[p.attributes.title];
              assert(pn);

              assert(p.id, pn.id);

              assert.equal(p.attributes.title, pn.title);
              assert.equal(p.attributes.text, pn.text);

              assert(p.relationships);
              assert(p.relationships.tags);
              assert.equal(p.relationships.tags.data.length, 2);
            });

            assert.equal(res.body.meta.count, 3);

            done();
          });
        });

      });

      it ('should search for posts by title', function (done) {
        let posts = [
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
        let posts = [
          postStub(),
          postStub(),
          postStub(),
          postStub()
        ];

        let searchText = ' mussum ipsum';

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
        let posts = [
          postStub(),
          postStub(),
          postStub(),
          postStub()
        ];

        let searchText = ' mussum ipsum';
        let searchText2 = '2222m ipsum';

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
          return null;
        })
        .catch(done);
      });

      it ('should return 404 to not found', function (done) {
        let info = we.log.info;
        we.log.info = function() {};
        request(http)
        .get('/post/1232131')
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

          let updateData = {
            data: {
              attributes: {
                title: 'iIIeeei'
              }
            }
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
            assert.equal(res.body.data.attributes.title, updateData.data.attributes.title);
            assert.equal(res.body.data.attributes.text, p.text);

            done();
          });
          return null;
        })
        .catch(done);
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
              return null;
            })
            .catch(done);
          });
          return null;
        })
        .catch(done);
      });
    });

    describe('POST /post', function(){
      it ('should create one resource with valid data', function (done) {
        let p = postStub(null, true);
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
          assert.equal(res.body.data.attributes.title, p.data.attributes.title);
          assert.equal(res.body.data.attributes.text, p.data.attributes.text);

          done();
        });
      });

      it ('should create one resource with valid data and JSONApi post data', function (done) {
        let p = postStub(null, true);
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
          assert.equal(res.body.data.attributes.title, p.data.attributes.title);
          assert.equal(res.body.data.attributes.text, p.data.attributes.text);

          done();
        });
      });

      it ('should return error if not set an not null attr', function (done) {
        let p = postStub(null, true);
        p.data.attributes.title = null;

        request(http)
        .post('/post')
        .send(p)
        .set('Content-Type', 'application/vnd.api+json')
        .set('Accept', 'application/vnd.api+json')
        .expect(400)
        .end(function (err, res) {
          if (err) throw err;

          assert(!res.body.data.id);
          assert.equal(res.body.errors[0].status, 400);
          assert.equal(res.body.errors[0].title, 'post.title cannot be null');

          // assert.equal(res.body.data.attributes.title, p.data.attributes.title);
          // assert.equal(res.body.data.attributes.text, p.data.attributes.text);

          done();
        });
      });
    });
  });
});
