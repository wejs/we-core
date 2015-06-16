var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

function widgetStub() {
  return {
    title: 'a widgetTitle',
    layout: 'default',
    regionName: 'highlighted',
    type: 'html',
    theme: 'app',
    configuration: {
      html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/Oiyh33__Txw"'+
       'frameborder="0" allowfullscreen></iframe>'
    }
  }
}

describe('templatesFeature', function() {
  // var salvedUser, salvedUserPassword;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    return done();
  });

  describe('API', function() {
    it ('should load all layouts on we.js bootstrap');

    it ('should load / page with layout and regions', function (done) {

      var ws = [ widgetStub(), widgetStub(), widgetStub() ];
      we.db.models.widget.bulkCreate(ws).then(function () {
        request(http)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          // console.log('res.text', res.text)
          if (err) throw err;
          assert(res.text);
          done();
        });
      });
    });
  })

});