var projectPath = process.cwd();
var we = require('../lib');
var pluginManager = require('../lib/pluginManager');
var deleteDir = require('rimraf');

before(function(callback) {
  we.bootstrap({
    port: 9800,
    log: {
      level: 'silly'
    }
  } , function(err, we) {
    we.startServer(function(err, we) {
      if (err) return console.error(err);
      callback(); 
    })
  })
})

// after all tests
after(function (callback) {
  // delete temp dir
  deleteDir( projectPath + '/files' , function(err) {
    if (err) console.error('Error on delete temp dir: ', err);
    callback();
  });
})