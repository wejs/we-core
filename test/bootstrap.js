var projectPath = process.cwd();
var path = require('path');
var deleteDir = require('rimraf');
var async = require('async');
var testTools = require('we-test-tools');
var We = require('../lib');
var we;

// we-test-tools

before(function(callback) {
  this.slow(100);

  testTools.copyLocalConfigIfNotExitst(projectPath, function() {
    we = new We();

    testTools.init({}, we);

    we.bootstrap({
      // disable access log
      enableRequestLog: false,

      i18n: {
        directory: path.resolve(__dirname, '..', 'config/locales'),
        updateFiles: true
      },
      themes: {
        enabled: ['we-theme-site-wejs', 'we-theme-admin-default'],
        app: 'we-theme-site-wejs',
        admin: 'we-theme-admin-default'
      }
    }, function (err, we) {
      if (err) return console.error(err);
      we.startServer(function (err) {
        if (err) return console.error(err);
        callback();
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