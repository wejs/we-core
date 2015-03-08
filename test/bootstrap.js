var projectPath = process.cwd();
var we = require('../lib');
var pluginManager = require('../lib/pluginManager');

before(function(callback) {
  // bootstrap we.js after run the tests
  pluginManager.loadPlugin( projectPath + '/plugin.js', 'we-core', projectPath);

  we.bootstrap({
    port: 9800
  } , function(err, we) {

    we.startServer(function(err, we) {
      if (err) return console.error(err);
      callback(); 
    })
  })
})