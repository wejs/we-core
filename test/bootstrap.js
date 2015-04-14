var projectPath = process.cwd();
var deleteDir = require('rimraf');
var fs = require('fs-extra');
var path = require('path');
var async = require('async');
var we;

before(function(callback) {
  this.slow(100);

  copyLocalConfigIfNotExitst(function() {
    we = require('../lib');
    we.bootstrap({
      i18n: {
        directory: path.join(__dirname, 'locales'),
        updateFiles: true
      }
    } , function(err, we) {
      if (err) return console.error(err);
      we.startServer(function(err) {
        if (err) return console.error(err);
        callback();
      })
    })

  })
})

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
  })

})

function copyLocalConfigIfNotExitst (cb) {
  var dest = path.resolve(projectPath, 'config', 'local.js');

  fs.lstat(dest, function(err) {
    if (!err) return cb();

    fs.ensureDir(path.resolve(projectPath, 'config'), function (err) {
      if (err) throw new Error(err);

      var source = path.resolve(projectPath ,'test/stubs', 'local.js');
      return fs.copy(source, dest, function(err) {
        if (err) throw new Error(err);

        cb();
      });
    });
  });
}