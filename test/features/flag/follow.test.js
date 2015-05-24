var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

describe('followFeature', function () {
  var salvedPage, salvedUser, salvedUserPassword;
  var authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);

      salvedUser = user;
      salvedUserPassword = userStub.password;

      var pageStub = stubs.pageStub(user.id);
      we.db.models.page.create(pageStub)
      .then(function (p) {
        salvedPage = p;

        // login user and save the browser
        authenticatedRequest = request.agent(http);
        authenticatedRequest.post('/login')
        .set('Accept', 'application/json')
        .send({
          email: salvedUser.email,
          password: salvedUserPassword
        })
        .expect(200)
        .set('Accept', 'application/json')
        .end(function (err) {
          if(err) throw err;
          done();
        });
      })
    });
  });


  it('get /api/v1/follow/:model/:modelId? should return empty follow list if user dont are following model', function (done) {
    authenticatedRequest
    .get('/api/v1/follow/page/' + salvedPage.id)
    .set('Accept', 'application/json')
    .end(function (err, res) {
      assert.equal(200, res.status);
      assert(res.body.follow);
      assert( _.isArray(res.body.follow) , 'follow not is array');
      assert( _.isEmpty(res.body.follow));
      done();
    });
  });

  it('post /api/v1/follow/:model/:modelId should follow model', function (done) {

    authenticatedRequest
    .post('/api/v1/follow/page/' + salvedPage.id)
    .set('Accept', 'application/json')
    .end(function (err, res) {
      assert.equal(200, res.status);
      assert(res.body.follow);
      assert(res.body.follow.id);
      assert.equal('page', res.body.follow.model);
      assert.equal(salvedPage.id, res.body.follow.modelId);
      assert.equal(salvedUser.id, res.body.follow.userId);
      done();
    });
  });

  it('delete /api/v1/follow/:model/:modelId should unfollow model', function (done) {

    authenticatedRequest
    .delete('/api/v1/follow/page/' + salvedPage.id)
    .set('Accept', 'application/json')
    .end(function (err, res) {
      assert.equal(204, res.status);
      assert( _.isEmpty(res.body) );

      // check if is following
      we.db.models.follow.isFollowing(
        salvedUser.id, 'page', salvedPage.id)
      .then(function (follow) {
        assert( _.isEmpty(follow) );
        done();
      });
    });
  });

});
