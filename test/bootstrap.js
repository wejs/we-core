var projectPath = process.cwd();
var we = require('../lib');
var deleteDir = require('rimraf');
var path = require('path');
var async = require('async');

before(function(callback) {
  we.bootstrap({
    port: 9800,
    hostname: 'http://localhost:9800',
    i18n: {
      directory: path.join(__dirname, 'locales'),
      updateFiles: true
    },
    passport: {
      accessTokenTime: 300000000,
      cookieDomain: null,
      cookieName: 'weoauth',
      cookieSecure: false
    }
  } , function(err, we) {
    we.startServer(function(err) {
      if (err) return console.error(err);
      callback();
    })
  })
})

// after all tests
after(function (callback) {
  we.db.defaultConnection.close();

  var tempFolders = [
    projectPath + '/files/tmp',
    projectPath + '/files/uploads',
    projectPath + '/files/config',
    projectPath + '/files/sqlite',

    projectPath + '/files/public/min',

    projectPath + '/files/public/tpls.hbs.js',
    projectPath + '/files/public/admin.tpls.hbs.js',
    projectPath + '/files/public/project.css',
    projectPath + '/files/public/project.js'
  ];

  async.each(tempFolders, function(folder, next){
    deleteDir( folder, next);
  }, function(err) {
    if (err) throw new Error(err);
    callback();
  })

})