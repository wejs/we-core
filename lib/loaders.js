/**
 * We.js config and resouces loader
 */

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var requireAll = require('require-all');
var async = require('async');
var Controller = require('./class/Controller.js');

module.exports = {
  loadControllers: function loadControllers(we, cb) {
    var controllers = {};
    async.parallel([
      function loadPluginControllers(done) {
        async.each(we.pluginNames, function(pluginName, next) {
          if (!we.plugins[pluginName].controllers) return next();
          _.merge(controllers, we.plugins[pluginName].controllers);
          next();
        }, done);
      },
      function loadProjectControllers(done) {
        var PMP = path.resolve(we.projectPath, 'server', 'controllers');
        fs.exists(PMP, function(exists) {
          // this project dont have controllers and the controllers folder
          if (!exists) return done();
          // load and merge all controllers
          _.merge(controllers, requireAll({
            dirname     :  PMP,
            filter      :  /(.+)\.js$/
          }));

          done();
        });
      }
    ], function (err) {
      var controllerOO = {};
      var controllerNames = Object.keys(controllers);
      controllerNames.forEach(function(n) {
        controllerOO[n] = new Controller(controllers[n]);
      });

      return cb(err, controllerOO);
    });
  }
}
