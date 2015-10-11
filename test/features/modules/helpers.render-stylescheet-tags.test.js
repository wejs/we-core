var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we, helper;

describe('helpers.render-stylesheet-tags', function () {

  before(function (done) {
    we = helpers.getWe();
    helper = require('../../../server/helpers/render-stylesheet-tags.js')(we, we.view);
    done();
  });

  it('helper should return html header tags', function (done) {
    var html = helper.bind({
      theme: 'we-theme-site-wejs'
    })(null, {
      hash: {}
    });
    assert(html);
    assert(html.indexOf('<link href="/public/plugin/we-core/files/we.css') === 0);
    done();
  });

  it('helper should return html header tags if location not is string', function (done) {
    var html = helper.bind({
      theme: 'we-theme-site-wejs'
    })({ invalid: true }, {
      hash: {}
    });
    assert(html);
    assert(html.indexOf('<link href="/public/plugin/we-core/files/we.css') === 0);
    done();
  });


  it('helper should return prod html header tags', function (done) {
    we.env = 'prod';
    var html = helper.bind({
      theme: 'we-theme-site-wejs'
    })(null, {
      hash: {}
    });
    assert(html);
    assert(html.indexOf('<link href="/public/project/build/prod') === 0);
    we.env = 'test';
    done();
  });
});