var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http, we;

describe('userFeature', function () {
  var salvedUser, salvedUserPassword, salvedUser2, authenticatedRequest;

  before(function (done) {
    we = helpers.getWe();
    http = helpers.getHttp();

    we.utils.async.series([
      function createOneUser(done) {
        var userStub = stubs.userStub();

        // after all create one user
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
          .end(function () {
            done();
          });
        })
      },
      function createUser2(done) {
        // after all create one user
        request(http)
        .post('/admin/user/create')
        .set('Accept', 'application/json')
        .expect(201)
        .send( stubs.userStub() )
        .end(function (err, res) {
          if (err) return done(err);
          salvedUser2 = res.body.user;
          done();
        });
      },
      function createAnAuthenticatedRequest(done) {
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
          if(err) return done(err);
          done();
        });
      }
    ], done);
  });

  // describe('resourceCache', function () {
  //   it('get /user route should return 304 with empty body for not modified resource', function (done) {
  //     request(http)
  //     .get('/user/'+salvedUser.id)
  //     .set('Accept', 'application/json')
  //     .set('If-Modified-Since', new Date(salvedUser.updatedAt).toUTCString())
  //     .expect(304)
  //     .end(function (err, res) {
  //       if (err) throw err;
  //       assert(_.isEmpty(res.body));
  //       done();
  //     });
  //   });
  // });

  describe('find', function () {
    it('get /user route should return user list', function (done) {
      request(http)
      .get('/user')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        assert(res.body.user);
        assert( _.isArray(res.body.user) , 'user not is array');
        assert(res.body.meta);
        done();
      });
    });
  });

  describe('create', function () {

    it('post /admin/user/create create one user record', function (done) {
      this.slow(300);
      var userStub = stubs.userStub();

      request(http)
      .post('/admin/user/create')
      .set('Accept', 'application/json')
      .send(userStub)
      .end(function (err, res) {
        if (err) console.error(err);
        assert.equal(201, res.status);
        assert(res.body.user);

        var user = res.body.user;
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
        var user = res.body.user;
        // check user attrs
        assert.equal(user.id, salvedUser.id);
        assert.equal(user.username, salvedUser.username);
        assert.equal(user.displayName, salvedUser.displayName);
        //assert.equal(user.fullName, userStub.fullName);
        assert.equal(user.biography, salvedUser.biography);
        assert.equal(user.language, salvedUser.language);
        assert.equal(user.gender, salvedUser.gender);

        done();
      });
    });

    it('get /user/:id should return one user with we.config.sendNestedModels=false', function (done) {

      we.config.sendNestedModels = false;

      request(http)
      .get('/user/' + salvedUser.id)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) console.error(err);
        assert.equal(200, res.status);
        assert(res.body.user);
        var user = res.body.user;
        // check user attrs
        assert.equal(user.id, salvedUser.id);
        assert.equal(user.username, salvedUser.username);
        assert.equal(user.displayName, salvedUser.displayName);
        //assert.equal(user.fullName, userStub.fullName);
        assert.equal(user.biography, salvedUser.biography);
        assert.equal(user.language, salvedUser.language);
        assert.equal(user.gender, salvedUser.gender);

        we.config.sendNestedModels = true;

        done();
      });
    });

    // it('get /user/:username should find one user by username', function(done) {
    //   request(http)
    //   .get('/user/' + salvedUser.username)
    //   .set('Accept', 'application/json')
    //   .expect('Content-Type', /json/)
    //   .end(function (err, res) {
    //     if (err) console.error(err);

    //     assert.equal(200, res.status);
    //     assert(res.body.user);

    //     assert( _.isArray(res.body.user) , 'res.body.user not is array');
    //     var user = res.body.user[0];
    //     // check user attrs
    //     assert.equal(user.username, salvedUser.username);
    //     assert.equal(user.displayName, salvedUser.displayName);
    //     //assert.equal(user.fullName, userStub.fullName);
    //     assert.equal(user.biography, salvedUser.biography);
    //     assert.equal(user.language, salvedUser.language);
    //     assert.equal(user.gender, salvedUser.gender);

    //     done();
    //   });
    // });
  });

  describe('update', function () {
    // it('put /user/:id should update one user displayName and bio', function(done) {
    //   var userStub = stubs.userStub();

    //   request(http)
    //   .put('/user/' + salvedUser.id)
    //   .set('Accept', 'application/json')
    //   .send({
    //     displayName: userStub.displayName,
    //     biography: userStub.biography
    //   })
    //   .expect('Content-Type', /json/)
    //   .end(function (err, res) {
    //     if (err) throw err;

    //     assert.equal(200, res.status);
    //     assert(res.body.user);

    //     assert( _.isArray(res.body.user) , 'res.body.user not is array');
    //     var user = res.body.user[0];

    //     // new values
    //     assert.equal(user.displayName, userStub.displayName);
    //     assert.equal(user.biography, userStub.biography);

    //     // old values
    //     //assert.equal(user.fullName, userStub.fullName);
    //     assert.equal(user.username, salvedUser.username);
    //     assert.equal(user.language, salvedUser.language);
    //     assert.equal(user.gender, salvedUser.gender);

    //     // update salved user cache
    //     salvedUser.displayName = userStub.displayName;
    //     salvedUser.biography = userStub.biography;

    //     done();
    //   });

    // });
  });

  describe('updateAttribute', function () {
    it('put /user/:id/:attributeName should update one user attribute');
  });

  describe('remove', function () {
    it('delete /api/v1/user/:name should delete one user file');
  });

  describe('privacity', function() {
    before(function (done) {
      we.db.models.userPrivacity.create({
        userId: salvedUser.id,
        field: 'gender',
        privacity: 'private'
      }).then(function(){
        done();
      }).catch(done);
    })

    describe('find', function () {

      it('get /user route should return user list with privacity suport', function (done) {
        request(http)
        .get('/user')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          assert(res.body.user);
          assert( _.isArray(res.body.user) , 'user not is array');
          assert(res.body.meta);

          res.body.user.forEach(function (u){
            if (u.id == salvedUser.id) {
              assert(!u.gender);
            } else {
              assert(u.gender);
            }
          })

          done();
        });
      });
    });

    describe('findOne', function () {
      it('get /user/:id route should return user data with privacity suport', function (done) {
        request(http)
        .get('/user/'+salvedUser.id)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          assert(res.body.user);

          assert.equal(res.body.user.id, salvedUser.id);
          assert(!res.body.user.genger);

          done();
        });
      });
    });

    describe('updateUserPrivacity', function () {
      it('post /user/:userId/edit/privacity should update user privacity settings', function (done) {

        var newValues = {
          fullName: 'public',
          biography: 'private',
          gender: 'public',
          language: 'public',
          organization: 'private'
        };

        authenticatedRequest
        .post('/user/'+salvedUser.id+'/edit/privacity ')
        .send(newValues)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body.privacity);

          we.db.models.userPrivacity.findAll({
            where: {
              userId: salvedUser.id
            },
            raw: true
          }).then(function (records) {

            records.forEach(function (r) {
              // check if privacity in db is same as configs
              assert.equal(newValues[r.field], r.privacity, 'wong privacity settings: '+r.field+ ': '+ r.privacity);
            });

            done();
          }).catch(done);
        });

      });
    });

    after(function (done) {
      // cleanup
      we.db.models.userPrivacity.destroy({
        truncate: true
      }).then(function(){
        done();
      }).catch(done);
    });
  })

});
