var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;

describe('userFeature', function () {
  var salvedUser;

  before(function (done) {
    http = helpers.getHttp();
    // after all create one user
    request(http)
    .post('/user')
    .set('Accept', 'application/json')    
    .send( stubs.userStub() )
    .end(function (err, res) {
      salvedUser = res.body.user[0];
      done();
    });
  }); 

  describe('find', function () {
    it('get /user route should return one user list', function (done) {
      request(http)
      .get('/user')
      .set('Accept', 'application/json')      
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.user);
        assert( _.isArray(res.body.user) , 'user not is array');
        assert.equal(res.body.user[0].id, salvedUser.id, 'first image returned from find dont are the salved user');
        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {

    it('post /user create one user record', function (done) {
      this.slow(300);
      var userStub = stubs.userStub();

      request(http)
      .post('/user')
      .set('Accept', 'application/json')      
      .send(userStub)
      .end(function (err, res) {
        if (err) console.error(err);
        assert.equal(201, res.status);
        assert(res.body.user);

        var user = res.body.user[0];
        // check user attrs
        assert.equal(user.username, userStub.username);
        assert.equal(user.displayName, userStub.displayName);
        //assert.equal(user.fullName, userStub.fullName);        
        assert.equal(user.biography, userStub.biography);
        assert.equal(user.language, userStub.language);
        assert.equal(user.gender, userStub.gender);

        done();
      });
    });
    
  });  

  describe('findOne', function () {
    it('get /user/:id should return one user', function(done) {
      request(http)
      .get('/user/' + salvedUser.id)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) console.error(err);
        assert.equal(200, res.status);
        assert(res.body.user);

        assert( _.isArray(res.body.user) , 'res.body.user not is array');        

        var user = res.body.user[0];

        // check user attrs
        assert.equal(user.username, salvedUser.username);
        assert.equal(user.displayName, salvedUser.displayName);
        //assert.equal(user.fullName, userStub.fullName);        
        assert.equal(user.biography, salvedUser.biography);
        assert.equal(user.language, salvedUser.language);
        assert.equal(user.gender, salvedUser.gender);

        done();
      });
    });
  });

  describe('update', function () {
    it('put /user/:id should update one user');
  });

  describe('updateAttribute', function () {
    it('put /user/:id/:attributeName should update one user attribute');
  });  

  describe('remove', function () {
    it('delete /api/v1/image/:name should delete one image file');
  });
});
