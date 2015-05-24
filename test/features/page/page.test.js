var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

describe('pageFeature', function () {
  var salvedPage, salvedUser, salvedUserPassword;
  var authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

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
      .end(function (err, res) {
        if (err) throw err;
        var pageStub = stubs.pageStub(user.id);
        we.db.models.page.create(pageStub)
        .then(function (p) {
          salvedPage = p;
          done();
        })

      });

    });
  });

  describe('find', function () {
    it('get /page route should find one page', function(done){
      request(http)
      .get('/page')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.page);
        assert( _.isArray(res.body.page) , 'page not is array');
        assert(res.body.meta);

        done();
      });
    });
  });

  describe('create', function () {

    it('post /page create one page record', function(done) {
      var pageStub = stubs.pageStub(salvedUser.id);

      authenticatedRequest
      .post('/page')
      .send(pageStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw err;

        assert.equal(201, res.status);
        assert(res.body.page);
        assert(res.body.page[0].title, pageStub.title);
        assert(res.body.page[0].about, pageStub.about);
        assert(res.body.page[0].body, pageStub.body);
        done();
      });
    });
  });

  describe('findOne', function () {
    it('get /page/:id should return one page', function(done){
      request(http)
      .get('/page/' + salvedPage.id)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw err;
        assert.equal(200, res.status);
        assert(res.body.page);
        assert(res.body.page[0].title, salvedPage.title);
        assert(res.body.page[0].about, salvedPage.about);
        assert(res.body.page[0].body, salvedPage.body);
        done();
      });
    });
  });

  describe('update', function () {
    it('put /page/:id should upate and return page', function(done){
      var newTitle = 'my new title';

      authenticatedRequest
      .put('/page/' + salvedPage.id)
      .send({
        title: newTitle
      })
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw err;
        assert.equal(200, res.status);
        assert(res.body.page);
        assert(res.body.page[0].title, newTitle);

        salvedPage.title = newTitle;
        done();
      });
    });
  });

  describe('destroy', function () {
    it('delete /page/:id should delete one page', function(done){
      var pageStub = stubs.pageStub(salvedUser.id);
      we.db.models.page.create(pageStub)
      .then(function (p) {
        authenticatedRequest
        .delete('/page/' + p.id)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) throw err;
          assert.equal(204, res.status);
          we.db.models.page.findById(p.id).then( function(page){
            assert.equal(page, null);
            done();
          })
        });
      })
    });
  });
});
