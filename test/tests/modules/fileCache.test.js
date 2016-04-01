var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var fs = require('fs');
var cacheAllTemplates, loadTemplatesFromCacheBuild, we;

describe('fileCache', function () {
  before(function (done) {
    we = helpers.getWe();

    cacheAllTemplates = we.view.cacheAllTemplates;
    loadTemplatesFromCacheBuild = we.view.loadTemplatesFromCacheBuild;

    done();
  });

  it('cacheAllTemplates should resolve and save all templates in one file', function (done) {

    cacheAllTemplates(we, function afterCache (err){
      if (err) throw err;

      fs.lstat(we.config.templatesCacheFile, function (err) {
        if (err) throw err;
        done();
      });
    });
  });

  it('loadTemplatesFromCacheBuild should load and compile all templates', function (done) {

    cacheAllTemplates(we, function afterCache (err){
      if (err) throw err;

      loadTemplatesFromCacheBuild(we, function afterLoadFromCache (err){
        if (err) throw err;

        assert(we.view.layoutCache['we-theme-site-wejs/default']);
        assert(we.view.layoutCache['we-theme-admin-default/default']);

        done();
      });
    });
  });
});