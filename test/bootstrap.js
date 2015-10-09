var projectPath = process.cwd();
var path = require('path');
var deleteDir = require('rimraf');
var async = require('async');
var testTools = require('we-test-tools');
var we;

// we-test-tools

before(function(callback) {
  this.slow(100);

  testTools.copyLocalConfigIfNotExitst(projectPath, function() {
    we = require('../lib');
    // skyp warnings
    we.log.warn = function(){};

    testTools.init({}, we);

    testTools.helpers.resetDatabase(we, function(err) {
      if(err) return callback(err);

      we.bootstrap({
        i18n: {
          directory: path.resolve(__dirname, '..', 'config/locales'),
          updateFiles: true
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
});

//after all tests
after(function (callback) {


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
  ];

  async.each(tempFolders, function(folder, next){
    deleteDir( folder, next);
  }, function(err) {
    if (err) throw new Error(err);
    callback();
  });
})