var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var email, we;

function emailStub() {
  return {
    to: 'contact@wejs.org',
    html: '<h2>Hello world!</h2>',
    test: 'Hello in text'
  }
}

describe('lib.Email', function () {
  before(function (done) {
    we = helpers.getWe();
    email = we.email;
    done();
  });
  describe('send', function(){
    it('should run showDebugEmail if are in test env', function (done) {
      var showDebugEmailCalled = false;
      var options = emailStub();
      var old_showDebugEmail = email.showDebugEmail;
      email.showDebugEmail = function(opts) {
        assert.equal(opts.from, email.mailOptions.from);
        assert.equal(opts.subject, email.mailOptions.subject);
        assert.equal(opts.to, options.to);
        assert.equal(opts.html, options.html);
        assert.equal(opts.text, options.text);
        showDebugEmailCalled = true;
      }

      email.send(options, function (err) {
        if (err) return done(err);

        assert(showDebugEmailCalled, 'showDebugEmail not run');

        email.showDebugEmail = old_showDebugEmail;

        done();
      });
    });

    it('should run showDebugEmail if email.mailOptions.sendToConsole', function (done) {
      var old_env = we.env;
      we.env = 'dev';
      var old_sendToConsole = email.mailOptions.sendToConsole;
      email.mailOptions.sendToConsole = true;

      var showDebugEmailCalled = false;
      var options = emailStub();
      var old_showDebugEmail = email.showDebugEmail;
      email.showDebugEmail = function(opts) {
        assert.equal(opts.from, email.mailOptions.from);
        assert.equal(opts.subject, email.mailOptions.subject);
        assert.equal(opts.to, options.to);
        assert.equal(opts.html, options.html);
        assert.equal(opts.text, options.text);
        showDebugEmailCalled = true;
      }

      email.send(options, function (err) {
        if (err) return done(err);

        assert(showDebugEmailCalled, 'showDebugEmail not run');

        email.showDebugEmail = old_showDebugEmail;
        we.env = old_env;
        email.mailOptions.sendToConsole = old_sendToConsole;

        done();
      });
    });

    it('should run showDebugEmail and set to as email option', function (done) {
      var showDebugEmailCalled = false;
      var options = emailStub();
      options.email = options.to;
      delete options.to;

      var old_showDebugEmail = email.showDebugEmail;
      email.showDebugEmail = function(opts) {
        assert.equal(opts.from, email.mailOptions.from);
        assert.equal(opts.subject, email.mailOptions.subject);
        assert.equal(opts.to, options.email);
        assert.equal(opts.html, options.html);
        assert.equal(opts.text, options.text);
        showDebugEmailCalled = true;
      }

      email.send(options, function (err) {
        if (err) return done(err);

        assert(showDebugEmailCalled, 'showDebugEmail not run');

        email.showDebugEmail = old_showDebugEmail;

        done();
      });
    });


    it('should run showDebugEmail and print the email in console', function (done) {
      var called_info, called_warn;

      var info = we.log.info;
      we.log.info = function() {
        called_info = true;
      }
      var warn = we.log.warn;
      we.log.warn = function() {
        called_warn = true
      }

      var options = emailStub();

      email.send(options, function (err) {
        if (err) return done(err);

        assert(called_info, 'we.log.info called');
        assert(called_warn, 'we.log.warn called');

        we.log.info = info;
        we.log.warn = warn

        done();
      });
    });
  });
});