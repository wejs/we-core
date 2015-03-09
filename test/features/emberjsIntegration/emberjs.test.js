var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;
var db;

describe('emberjsIntegration', function () {
  before(function (done) {
    http = helpers.getHttp();
    db = helpers.getDB();
    done();
  });
  
  it('get /api/v1/models/emberjs should return the we.js models in ember.js format', function(done){ 
    request(http)
    .get('/api/v1/models/emberjs')
    .end(function (err, res) {
      // check if route exists
      assert.equal(200, res.status);
      // check if the models are in response file
      for ( var modelName in db.models ) {
        assert(res.text.indexOf( 'App.' + helpers.capitalize( modelName ) >  -1) );
      }
      done();
    });
  });
});
