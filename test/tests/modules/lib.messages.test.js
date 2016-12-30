var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var messages, we;

describe('lib/messages', function () {
  before(function (done) {
    messages = require('../../../src/messages');
    we = helpers.getWe();
    done();
  });

  it('setFunctionsInResponse should set addMessage, getMessages and moveLocalsMessagesToFlash', function (done) {
    var req = {};
    var res = {
      locals: {}
    };

    messages.setFunctionsInResponse(req, res);

    assert(res.addMessage);
    assert(res.getMessages);
    assert(res.moveLocalsMessagesToFlash);

    assert(res.locals.messages);

    done();
  });

  describe('response with messageMethods', function(){
    var res, req;
    before(function (done) {
      res = { locals: {} }
      req = { __: we.i18n.__ }

      messages.setFunctionsInResponse(req, res)

      done()
    });
    describe('res.addMessage', function(){
      it ('should add one error message', function(done) {
        res.addMessage('error', 'we.test.message.1');

        assert.equal(res.locals.messages[0].status, 'danger');
        assert.equal(res.locals.messages[0].message, 'we.test.message.1');
        assert.equal(res.locals.messages[0].extraData, null);

        res.locals.messages = [];

        done();
      });

      it ('should add one warn message', function(done) {
        res.addMessage('warn', {
          text: 'we.test.message.2',
          vars: { uno: 'dos' }
        }, {
          field: 'name'
        });

        assert.equal(res.locals.messages[0].status, 'warning');
        assert.equal(res.locals.messages[0].message, 'we.test.message.2');
        assert.equal(res.locals.messages[0].extraData.field, 'name');

        res.locals.messages = [];

        done();
      });

      it ('should add one warn message without localization and with text param', function(done) {
        var res = { locals: {} };
        var req = {}

        messages.setFunctionsInResponse(req, res);

        res.addMessage('warn', {
          text: 'we.test.message.3'
        });

        assert.equal(res.locals.messages[0].status, 'warning');
        assert.equal(res.locals.messages[0].message, 'we.test.message.3');

        res.locals.messages = [];

        done();
      });

      it ('should add one warn message without localization', function(done) {
        var res = { locals: {} };
        var req = {}

        messages.setFunctionsInResponse(req, res);

        res.addMessage('warn', 'we.test.message.4');

        assert.equal(res.locals.messages[0].status, 'warning');
        assert.equal(res.locals.messages[0].message, 'we.test.message.4');

        res.locals.messages = [];

        done();
      });
    });
    describe('res.getMessages', function(){
      it('should get messages from locals and flash', function (done) {
        var req = {
          we: we,
          flash: function() {
            return [{
              status: 'error',
              message: 'we.test.error.message'
            }]
          }
        }
        var res = {
          locals: {
            req: req,
            messages: [{
              status: 'success',
              message: 'we.test.message.10'
            }]
          }
        }

        messages.setFunctionsInResponse(req, res)
        var msgs = res.getMessages()

        assert(msgs);
        assert.equal(msgs[0].status, 'success');
        assert.equal(msgs[0].message, 'we.test.message.10');
        assert.equal(msgs[1].status, 'error');
        assert.equal(msgs[1].message, 'we.test.error.message');

        done();
      });
    });
    describe('res.moveLocalsMessagesToFlash', function(){
      it('should run res.getMessages and set in req.flash', function (done) {
        var req = {
          we: we,
          flash: function(name, data) {
            if (!data) return [];
            assert.equal(name, 'messages');

            assert.equal(data[0].status, 'success');
            assert.equal(data[0].message, 'we.test.message.11');

            done();
          }
        }
        var res = {
          locals: {
            req: req,
            messages: [{
              status: 'success',
              message: 'we.test.message.11'
            }]
          }
        }

        messages.setFunctionsInResponse(req, res)

        res.moveLocalsMessagesToFlash()
      });
    });
  });
});