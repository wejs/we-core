var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var we, password, async;

describe('serverModelsPassport', function () {
  this.slow(600); // slow routes

  before(function (done) {
    we = helpers.getWe();
    async = we.utils.async;
    password = we.db.models.password;
    done();
  });

  it('password.create should create one passsword with hashed password', function (done) {
    var pass = '123321';
    password.create({
      userId: 1,
      password: pass,
      confirmPassword: pass,
    }).then(function(p){
      assert.notEqual(pass, p.password);
      assert(p.active);

      password.findById(p.id).then(function(p){

        assert.notEqual(pass, p.password);
        assert(p.active);
        assert(!p.confirmPassword);
        done();
      }).catch(done);
    }).catch(done);
  });

  it('password.create should create one passsword and validate with pass', function (done) {
    var pass = 'dfgdfgfgd';
    password.create({
      userId: 1,
      password: pass,
      confirmPassword: pass,
    }).then(function(p){
      assert.notEqual(pass, p.password);

      p.validatePassword(pass, function(err, isOk){
        if (err) throw err;
        assert(isOk);
        done();
      })
    }).catch(done);
  });

  it('password.create should create one passsword and not validate with wrong pass', function (done) {
    var pass = 'asdasdas';
    password.create({
      userId: 1,
      password: pass,
      confirmPassword: pass,
    }).then(function(p){
      assert.notEqual(pass, p.password);

      p.validatePassword('otherpassword', function(err, isOk){
        if (err) throw err;
        assert(!isOk);
        done();
      })
    }).catch(done);
  });

  it('password.update should change the passowrd, validate with new pass and not with old pass', function (done) {
    var newPass = 'anewpass';
    var oldPass = 'aoldpass';
    password.create({
      userId: 1,
      password: oldPass,
      confirmPassword: oldPass,
    }).then(function(p){
      assert.notEqual(oldPass, p.password);
      async.series([
        function update(done) {
          p.password = newPass;
          p.save().then(function(){
            done();
          }).catch(done);
        },
        function validWithNew(done) {
          p.validatePassword(newPass, function(err, isOk){
            if (err) throw err;
            assert(isOk);
            done();
          });
        },
        function notValidWithOld(done) {
          p.validatePassword(oldPass, function(err, isOk){
            if (err) throw err;
            assert(!isOk);
            done();
          });
        }
      ], done);
    }).catch(done);
  });
});