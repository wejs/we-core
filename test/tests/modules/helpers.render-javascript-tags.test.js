var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we, helper;

describe('helpers.render-javascript-tags', function () {

  before(function (done) {
    we = helpers.getWe();
    helper = require('../../../server/helpers/render-javascript-tags.js')(we, we.view);
    done();
  });

  it('helper should return html header tags', function (done) {
    var html = helper.bind({})('header', {
      hash: {}
    });
    assert(html)
    assert(html.indexOf('<script src="/public/plugin/we-core/files/js/jquery.js') === 0);
    done();
  });

  it('helper should return html footer tags', function (done) {
    var html = helper.bind({
      theme: 'we-theme-site-wejs',
      locale: 'pt-br'
    })(null, {
      hash: {}
    });
    assert(html)
    assert(html.indexOf('<script src="/public/') === 0);
    done();
  });


  it('helper should return prod html in prod env', function (done) {
    we.env = 'prod';

    var html = helper.bind({
      theme: 'we-theme-site-wejs'
    })(null, {
      hash: {}
    });
    assert(html)
    assert(html.indexOf('<script src="/public/project/build/prod') === 0);
    we.env = 'test';
    done();
  });

});