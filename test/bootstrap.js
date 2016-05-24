var projectPath = process.cwd();
var path = require('path');
var deleteDir = require('rimraf');
var async = require('async');
var testTools = require('we-test-tools');
var ncp = require('ncp').ncp;
var We = require('../lib');
var we;

before(function(callback) {
  this.slow(100);

  testTools.copyLocalConfigIfNotExitst(projectPath, function() {
    ncp(
      path.resolve(__dirname, 'testData/we-plugin-post'),
      path.resolve(process.cwd(), 'node_modules/we-plugin-post'), function (err) {
      if (err) {
        return console.error(err);
      }

      we = new We();

      testTools.init({}, we);

      we.bootstrap({
        // disable access log
        enableRequestLog: false,

        i18n: {
          directory: path.resolve(__dirname, '..', 'config/locales'),
          updateFiles: true
        },
        themes: {}
      }, function (err, we) {
        if (err) return console.error(err);
        we.startServer(function (err) {
          if (err) return console.error(err);
          callback();
        });
      });

    });
  });
});

//after all tests
after(function (callback) {

  testTools.helpers.resetDatabase(we, function(err) {
    if(err) return callback(err);

    we.db.defaultConnection.close();

    var tempFolders = [
      path.resolve(process.cwd(), 'node_modules/we-plugin-post'),
      projectPath + '/files/tmp',
      projectPath + '/files/config',
      projectPath + '/files/sqlite',

      projectPath + '/files/public/min',

      projectPath + '/files/public/tpls.hbs.js',
      projectPath + '/files/public/admin.tpls.hbs.js',
      projectPath + '/files/public/project.css',
      projectPath + '/files/public/project.js',
      projectPath + '/files/uploads',
      projectPath + '/files/templatesCacheBuilds.js'
    ];

    async.each(tempFolders, function(folder, next){
      deleteDir( folder, next);
    }, function(err) {
      if (err) throw new Error(err);
      callback();
    });
  });
})