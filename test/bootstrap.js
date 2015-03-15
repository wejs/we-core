var projectPath = process.cwd();
var we = require('../lib');
var pluginManager = require('../lib/pluginManager');
var deleteDir = require('rimraf');
var path = require('path');

before(function(callback) {
  we.bootstrap({
    port: 9800,
    hostname: 'http://localhost:9800',
    i18n: {
      directory: path.join(__dirname, 'locales'),
      updateFiles: true
    },
    passport: {
      strategies: {
        // token
        weOauth2: {
          isProvider: true,

          providerHost: 'http://localhost:9800',

          accessTokenTime: 300000000,
          cookieDomain: null,
          cookieName: 'weoauth',
          cookieSecure: false,

          services: {

          }
        }
      }
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

  // delete temp dir
  deleteDir( projectPath + '/files' , function(err) {
    if (err) console.error('Error on delete temp dir: ', err);
    callback();
  });
})