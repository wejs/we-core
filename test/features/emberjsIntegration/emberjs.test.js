var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var http;
var db;
var we;

describe('emberjsIntegration', function () {
  before(function (done) {
    http = helpers.getHttp();
    db = helpers.getDB();
    we = helpers.getWe();
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

  it('get /api/v1/translations.js should return translation file for ember.js in user locale', function(done){
    request(http)
    .get('/api/v1/translations.js')
    .end(function (err, res) {
      // check if route exists
      assert.equal(200, res.status);
      assert.equal(res.type, 'application/javascript');

      done();
    });
  });

  it('get /api/v1/configs.json should return client side config', function(done){
    request(http)
    .get('/api/v1/configs.json')
    .end(function (err, res) {
      // check if route exists
      assert.equal(200, res.status);
      assert.equal(res.type, 'application/json');

      assert.equal(res.body.env, we.env);
      assert(res.body.client);
      assert(res.body.client.publicVars);


      assert.equal( res.body.appName, we.config.appName );
      assert.equal( res.body.appLogo, we.config.appLogo );
      assert.equal( res.body.defaultUserAvatar, we.config.defaultUserAvatar );

      done();
    });
  });

});