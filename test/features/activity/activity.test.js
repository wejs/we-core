
var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;

describe('activityFeature', function() {
  var salvedUser, salvedUserPassword;
  var authenticatedRequest;
  var salvedGroup;

  before(function (done) {

    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);

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
      .end(function (err) {
        if (err) return done(err);

        we.db.models.group.create(stubs.groupStub(salvedUser.id))
        .then(function (g) {
          salvedGroup = g;

          we.db.models.activity.create({
            modelName: 'group',
            modelId: g.id,
            actor: user.id,
            action: 'create',
            groupId: g.id
          }).then(function () {
            done();
          }).catch(done);
        });
      });
    })
  });

  describe('createRecord', function () {

    it('post /page create one create page activity', function(done) {
      var pageStub = stubs.pageStub(salvedUser.id);

      authenticatedRequest
      .post('/page')
      .send(pageStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(201, res.status);
        assert(res.body.page);
        assert(res.body.page[0].title, pageStub.title);
        assert(res.body.page[0].about, pageStub.about);
        assert(res.body.page[0].body, pageStub.body);


        we.db.models.activity.find({
          where: {
            modelName: 'page',
            modelId: res.body.page[0].id,
            action: 'create'
          }
        }).then(function(activity) {

          assert.equal(activity.modelId, res.body.page[0].id);
          assert.equal(activity.modelName, 'page');

          done();
        })

      });
    });
  });

  describe('find', function () {
    it('get /group/:groupId/activity should get group activity', function(done) {

      authenticatedRequest
      .get('/group/'+ salvedGroup.id +'/activity')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert(res.body.activity);
        assert(res.body.activity.length > 0);
        assert(res.body.meta.count);

        res.body.activity.forEach(function(activity){
          assert.equal(activity.groupId, salvedGroup.id);
        })

        done();
      });
    });

    it('get /activity should return activity list', function(done) {

      authenticatedRequest
      .get('/activity')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.activity);
        assert(res.body.activity.length > 0);
        assert(res.body.meta.count);
        done();
      });
    });
  });

});