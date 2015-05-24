var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

describe('commentFeature', function () {
  var salvedPage, salvedUser, salvedUserPassword;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      var pageStub = stubs.pageStub(user.id);
      we.db.models.page.create(pageStub)
      .then(function (p) {
        salvedPage = p;
        done();
      })
    });
  });

  describe('find', function () {
    it('get /comment?modelName=page&modelId=[id] route should return comments from model', function(done){
      request(http)
      .get('/comment?modelName=page&modelId=' + salvedPage.id)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.comment);
        assert( _.isArray(res.body.comment) , 'comment not is array');
        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {
    it('post /comment create one comment record', function(done) {
      var commentStub = stubs.commentStub(salvedUser.id, 'page', salvedPage);

      request(http)
      .post('/comment')
      .send(commentStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(201, res.status);
        assert(res.body.comment);
        assert.equal(res.body.comment[0].body, commentStub.body);
        done();
      });
    });
  });

  describe('findOne', function () {
    it('get /comment/:id should return one comment');
  });

  describe('update', function () {
    it('put /comment/:id should update and return comment', function(done){
      var commentStub = stubs.commentStub(salvedUser.id, 'page', salvedPage);
      we.db.models.comment.create(commentStub)
      .then(function (r) {
        var newBody = 'my new body';

        request(http)
        .put('/comment/' + r.id)
        .send({
          body: newBody
        })
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) return done(err);
          assert.equal(200, res.status);
          assert(res.body.comment);
          assert.equal(res.body.comment[0].body, newBody);

          done();
        });
      });
    });
  });

  describe('destroy', function () {
    it('delete /comment/:id should delete one comment', function(done){
      var commentStub = stubs.commentStub(salvedUser.id, 'page', salvedPage);
      we.db.models.comment.create(commentStub)
      .then(function (r) {
        request(http)
        .delete('/comment/' + r.id)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) return done(err);
          assert.equal(204, res.status);

          we.db.models.comment.findById(r.id)
          .then( function (comment) {
            assert.equal(comment, null);
            done();
          })
        });

      })
    });
  });
});
