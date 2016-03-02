var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;

describe('moduleAuth', function () {
  var auth, user, we, token = 'asdasdasdjasldkjakldalsjdaldjlj';

  before(function (done) {
    auth = require('../../../lib/auth');
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, u) {
      if(err) throw err;
      user = u;
      done();
    });
  });

  describe('auth.util.parseToken', function () {
    it('auth.util.parseToken should parse token from req.header', function (done) {
      assert.equal(token, auth.util.parseToken({
        we: we,
        header: function() {
          return 'Bearer '+token;
        }
      }));
      done();
    });
    it('auth.util.parseToken should parse token from req.cookies', function (done) {
      assert.equal(token, auth.util.parseToken({
        we: we,
        cookies: { weoauth: token }
      }));
      done();
    });
    it('auth.util.parseToken should parse token from req.query', function (done) {
      assert.equal(token, auth.util.parseToken({
        we: we,
        query: { access_token: token }
      }));
      done();
    });
    it('auth.util.parseToken should parse token from req.session', function (done) {
      assert.equal(token, auth.util.parseToken({
        we: we,
        session: { authToken: token }
      }));
      done();
    });
    it('auth.util.parseToken should return null if dont have token', function (done) {
      assert.equal(null, auth.util.parseToken({
        we: we
      }));
      done();
    });
  });

  describe('auth.util.checkIfTokenIsExpired', function () {
    it('auth.util.checkIfTokenIsExpired should return true for null accessTokenTime', function (done) {
      assert.equal(true, auth.util.checkIfTokenIsExpired({}, null));
      done();
    });
    it('auth.util.checkIfTokenIsExpired should return true for valid token', function (done) {
      assert.equal(true, auth.util.checkIfTokenIsExpired({
        createdAt: new Date().getTime()-200
      }, 900));
      done();
    });
    it('auth.util.checkIfTokenIsExpired should return false for invalid token', function (done) {
      assert.equal(false, auth.util.checkIfTokenIsExpired({
        createdAt: new Date().getTime()-10000
      }, 900));
      done();
    });
  });
  describe('auth.util.expireToken', function () {
    it('auth.util.expireToken should set token.isValid to false', function (done) {
      we.db.models.accesstoken.create({
        userId: 1
      }).then(function (t){
        assert(t);
        assert.equal(true, t.isValid);
        auth.util.expireToken(t.token, we, function(err, tokenR) {
          if (err) throw err;
          assert(tokenR);
          we.db.models.accesstoken.findById(t.id)
          .then(function (ts){
            assert(ts);
            assert.equal(false, ts.isValid);
            done();
          }).catch(done);
        });
      }).catch(done);
    });
  });
});