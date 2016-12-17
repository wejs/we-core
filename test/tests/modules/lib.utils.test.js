var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var path = require('path');
var utils, we;

describe('lib/utils', function () {
  before(function (done) {
    utils = require('../../../src/utils');
    we = helpers.getWe();
    done();
  });

  describe('listFilesRecursive', function() {
    it('should list files in we-plugin-post dir', function (done) {
      var folder = path.resolve(process.cwd(), 'node_modules', 'we-plugin-post');

      utils.listFilesRecursive(folder, function(err, files){
        if (err) return done(err);

        assert.equal(files.length, 12);

        assert(files.indexOf(folder+'/package.json') > -1);
        assert(files.indexOf(folder+'/plugin.js') > -1);
        assert(files.indexOf(folder+'/server/controllers/post.js') > -1);
        assert(files.indexOf(folder+'/server/models/hero.json') > -1);
        assert(files.indexOf(folder+'/server/models/post.js') > -1);
        assert(files.indexOf(folder+'/server/models/user.js') > -1);

        done();
      });
    });
    it('should return a empty list if the dir not is found', function (done) {
      var folder = path.resolve(process.cwd(), 'asadasdas');

      utils.listFilesRecursive(folder, function(err, files){
        if (err) return done(err);

        assert.equal(files.length, 0);

        done();
      });
    });
    it('should a empty list if the dir is one file', function (done) {
      var folder = path.resolve(process.cwd(), 'plugin.js');

      utils.listFilesRecursive(folder, function(err, files) {
        assert(!files);
        assert.equal(err.code, 'ENOTDIR');

        done();
      });
    });
  });

  describe('isNNAssoc', function() {
    it ('should return true if are a belongsTo assoc', function(done) {
      assert(utils.isNNAssoc({
        associationType: 'belongsTo'
      }));
      done();
    });
    it ('should return false if are a hasMany assoc', function(done) {
      assert(!utils.isNNAssoc({
        associationType: 'hasMany'
      }));
      done();
    });
  });

  describe('getRedirectUrl', function() {
    it ('should return a valid url from body', function(done) {
      var req = {
        we: we,
        body: {
          redirectTo: '/test'
        }
      };

      var url = utils.getRedirectUrl(req);
      assert.equal(url, '/test');

      done();
    });

    it ('should return null to invalid url from body', function(done) {
      var req = {
        we: we,
        body: {
          redirectTo: 'http://google.com'
        }
      };

      var url = utils.getRedirectUrl(req);
      assert.equal(url, null);

      done();
    });

    it ('should return url from service', function(done) {
      we.config.services.dance = {
        url: '/dancee'
      };

      var req = {
        we: we,
        query: {
          service: 'dance'
        }
      };

      var url = utils.getRedirectUrl(req);
      assert.equal(url, '/dancee');

      delete we.config.services.dance;

      done();
    });

    it ('should return url from query.redirectTo', function(done) {

      var req = {
        we: we,
        query: {
          redirectTo: '/iooo'
        }
      };

      var url = utils.getRedirectUrl(req);
      assert.equal(url, '/iooo');

      done();
    });
  });

  describe('parseAttributes', function(){
    it ('should return false if are a hasMany assoc', function (done) {

      var str = utils.helper.parseAttributes({
        hash: {
          class: 'btn btn-default'
        }
      });

      assert(str.indexOf('class="btn btn-default"') > -1);

      done();
    });
  })
});