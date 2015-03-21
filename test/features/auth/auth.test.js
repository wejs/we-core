var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var sinon = require('sinon');
var _ = require('lodash');
var http;
var we;
var agent;

describe('authFeature', function () {
  var salvedUser, salvedUserPassword;
  var authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user, password) {
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
      .end(function (err, res) {

        done();
      });
    })

  });

  describe('register', function () {
    it('post /signup route should register one user and send a confirmation email', function (done) {

      we.config.auth.requireAccountActivation = true;

      var userStub = stubs.userStub();
      userStub.confirmPassword = userStub.password;
      userStub.confirmEmail = userStub.email;

      request(http)
      .post('/signup')
      .send(userStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw new Error(err, res.text);

        assert.equal(201, res.status);
        assert(res.body.messages);
        assert(res.body.messages[0].status);
        assert(res.body.messages[0].message);

        done();
      });
    });

    it('post /signup route should register and login the user without requireAccountActivation', function (done) {
      this.slow(300);

      we.config.auth.requireAccountActivation = false;

      var userStub = stubs.userStub();
      userStub.confirmPassword = userStub.password;
      userStub.confirmEmail = userStub.email;

      agent.post('/signup')
      .send(userStub)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {

        assert.equal(201, res.status);
        assert(res.headers['set-cookie'])
        assert(res.body.user.id);
        assert.equal(res.body.user.displayName, userStub.displayName);
        assert.equal(res.body.user.gender, userStub.gender);
        assert.equal(res.body.user.username, userStub.username);
        assert.equal(res.body.user.biography, userStub.biography);
        assert.equal(res.body.user.language, userStub.language);

        assert(res.body.token);

        // use setTime out to skip supertest error
        // see: https://github.com/visionmedia/superagent/commit/04a04e22a4126bd64adf85b1f41f2962352203d1
        setTimeout(function() {

          agent.get('/account')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {

            assert(res.body.user[0].id);
            assert.equal(res.body.user[0].displayName, userStub.displayName);
            assert.equal(res.body.user[0].gender, userStub.gender);
            assert.equal(res.body.user[0].username, userStub.username);
            assert.equal(res.body.user[0].biography, userStub.biography);
            assert.equal(res.body.user[0].language, userStub.language);

            done();
          });

        }, 100);

      });
    });

    it('get /signup should load signup page', function (done) {
      request(http)
      .get('/signup')
      .expect(200)
      .end(function (err, res) {
        if (err) throw new Error(err);
        // todo add a static login form
        done();
      });
    })

  });

  describe('login', function () {
    it('get /login should load login page', function (done) {
      request(http)
      .get('/login')
      .expect(200)
      .end(function (err, res) {
        if (err) throw new Error(err);
        // todo add a static login form
        done();
      });
    })


    it('post /login should login one user', function (done) {

      request(http)
      .post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw new Error(err);

        assert(res.headers['set-cookie'])
        assert(res.body.user.id);
        assert.equal(res.body.user.displayName, salvedUser.displayName);
        assert.equal(res.body.user.id, salvedUser.id);
        assert.equal(res.body.user.username, salvedUser.username);

        assert(res.body.token);

        // todo add a static login form
        done();
      });
    })

    it('post /login should return error with wrong password', function (done) {
      this.slow(300); // route with brypt

      request(http)
      .post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: 'wrongpassword'
      })
      .expect(400)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw new Error(err);

        assert(res.body.messages)
        assert.equal(res.body.messages[0].status, 'warning');
        assert.equal(res.body.messages[0].message, 'auth.login.user.incorrect.password.or.email');

        // todo add a static login form
        done();
      });
    })
  });

  describe('activate', function () {
    it('get /user/:id/activate/:token activate one user', function (done) {

      salvedUser.active = false;
      salvedUser.save().done(function (err) {
        if(err) throw new Error(err);

        we.db.models.authtoken.create({ userId: salvedUser.id })
        .done(function (err, token) {
          if(err) throw new Error(err);

          request(http)
          .get('/user/'+ salvedUser.id +'/activate/' + token.token)
          .set('Accept', 'application/json')
          .expect(302)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) throw new Error(err);

            // get user from db to check if are active
            we.db.models.user.find(salvedUser.id).done(function(err, user) {
              if (err) throw new Error(err);

              assert.equal(true, user.active);

              // todo add a static login form
              done();
            })

          });
        });
      })
    })

    it('get /user/:id/activate/:token should return bad request with invalid token', function (done) {

      request(http)
      .get('/user/'+ salvedUser.id +'/activate/aninvalidtoken')
      .expect(400)
      .end(function (err, res) {
        if (err) throw new Error(err);

        done();
      });

    })

    it('get /user/:id/activate/:token should return bad request with invalid user id', function (done) {

      salvedUser.active = false;
      salvedUser.save().done(function (err) {
        if(err) throw new Error(err);

        request(http)
        .get('/user/10/activate/aninvalidtoken')
        .expect(400)
        .end(function (err, res) {
          if (err) throw new Error(err);

          done();
        });
      })
    })
  });

  describe('forgotPassword', function () {
    it('get /auth/forgot-password should load forgot-password page', function (done) {
      request(http)
      .get('/auth/forgot-password')
      .expect(200)
      .end(function (err, res) {
        if (err) throw new Error(err);
        // todo check tags
        done();
      });
    })

    it('post /auth/forgot-password should send AuthResetPasswordEmail pasword email and redirect', function (done) {
      // set spy to check is email is called
      sinon.spy(we.email, 'sendEmail');

      request(http)
      .post('/auth/forgot-password')
      .expect(302)
      .send({
        email: salvedUser.email
      })
      .end(function (err, res) {
        if (err) throw new Error(err);

        assert(we.email.sendEmail.calledOnce);

        assert.equal(we.email.sendEmail.args[0][0], 'AuthResetPasswordEmail');
        assert.equal(we.email.sendEmail.args[0][1].email, salvedUser.email);
        assert(we.email.sendEmail.args[0][2].resetPasswordUrl);

        we.email.sendEmail.restore();
        // todo check tags
        done();
      });
    });

  });


  describe('newPassword', function () {

    it('get /auth/:id/new-password should redirect if user dont are authenticated', function (done) {
      request(http)
      .get('/auth/'+ salvedUser.id +'/new-password')
      .expect(302)
      .end(function (err, res) {
        if (err) throw new Error(err);
        // todo check tags
        done();
      });
    })

    it('get /auth/:id/new-password should load newPasswordPage', function (done) {
      authenticatedRequest.get('/auth/'+ salvedUser.id +'/new-password')
      .expect(200)
      .end(function (err, res) {
        if (err) throw new Error(err);
        // todo check tags
        done();
      });
    })

    it('post /auth/new-password should load newPasswordPage', function (done) {
      this.slow(300);

      var newPassword = 'oneNewPassword';

      // unlock resetPassword
      we.db.models.authtoken.create({
        userId: salvedUser.id,
        tokenType: 'resetPassword'
      }).done(function (err, authToken) {
        if(err) return done(err);

        authenticatedRequest.get('/auth/'+ salvedUser.id +'/reset-password/' + authToken.token)
        .expect(302)
        .end(function (err, res) {
          if (err) throw new Error(err);

          // then change the password
          authenticatedRequest.post('/auth/new-password')
          .send({
            newPassword: newPassword,
            rNewPassword: newPassword
          })
          .expect(200)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) throw new Error(err);

            // check if new password is valid
            request(http)
            .post('/login')
            .set('Accept', 'application/json')
            .send({
              email: salvedUser.email,
              password: newPassword
            })
            .expect(200)
            .set('Accept', 'application/json')
            .end(function (err, res) {
              if (err) throw new Error(err);

              salvedUserPassword = newPassword;

              assert(res.headers['set-cookie'])
              assert(res.body.user.id);
              assert.equal(res.body.user.displayName, salvedUser.displayName);
              assert.equal(res.body.user.id, salvedUser.id);
              assert.equal(res.body.user.username, salvedUser.username);

              assert(res.body.token);

              // todo add a static login form
              done();
            });
          });

        })
      })
    })

  });

  describe('changePassword', function() {
    it('get /change-password should load change password page', function(done) {
      authenticatedRequest.get('/change-password')
      .expect(200)
      .end(function (err, res) {
        if(err) throw new Error(err);
        done();
      });
    });

    it('post /change-password should change user password', function(done) {
      this.slow(300);

      var newPassword = 'asdmdoadaansadnsanksn';

      authenticatedRequest.post('/change-password')
      .send({
        password: salvedUserPassword,
        newPassword: newPassword,
        rNewPassword: newPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) throw new Error(err);

        // check if new password is valid
        request(http)
        .post('/login')
        .set('Accept', 'application/json')
        .send({
          email: salvedUser.email,
          password: newPassword
        })
        .expect(200)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) throw new Error(err);

          salvedUserPassword = newPassword;

          assert(res.headers['set-cookie'])
          assert(res.body.user.id);
          assert.equal(res.body.user.displayName, salvedUser.displayName);
          assert.equal(res.body.user.id, salvedUser.id);
          assert.equal(res.body.user.username, salvedUser.username);

          assert(res.body.token);

          // todo add a static login form
          done();
        });
      });

    });

    it('post /change-password should return error with wront password');
  });

  describe('generateAuthToken', function () {
    it('post /auth/auth-token should return one auth token for authorized users');
    it('post /auth/auth-token should return forbidden for non authorized users');
  });


  describe('checkIfCanResetPassword', function() {

    it('get /api/v1/auth/check-if-can-reset-password should return true to one user how can reset the password');
    it('get /api/v1/auth/check-if-can-reset-password should return forbidden to not authenticated user', function(done) {
       request(http)
       .get('/api/v1/auth/check-if-can-reset-password')
        .expect(403)
        .end(function (err, res) {
          if(err) throw new Error(err);

          done();
        });
    });
  });

  describe('consumeForgotPasswordToken', function() {
    it('get /auth/:id/reset-password/:token should set req.session.resetPassword to true with valid token', function (done) {
      var localAgent = request.agent(http);

      we.db.models.authtoken.create({
        userId: salvedUser.id,
        tokenType: 'resetPassword'
      }).done(function (err, authToken) {
        if(err) return done(err);

        localAgent.get('/auth/'+ salvedUser.id +'/reset-password/' + authToken.token)
        .expect(302)
        .end(function (err, res) {
          if (err) throw new Error(err);

          // use setTime out to skip supertest error
          // see: https://github.com/visionmedia/superagent/commit/04a04e22a4126bd64adf85b1f41f2962352203d1
          setTimeout(function() {

            localAgent.get('/api/v1/auth/check-if-can-reset-password')
            .expect(200)
            .end(function (err, res) {
              if(err) throw new Error(err);

              assert.equal(res.body.messages[0].message, 'auth.reset-password.success.can');

              done();

            });

          }, 100);

        });

      })

    });

  });

});
