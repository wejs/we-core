/**
 * We.js config and resouces loader
 */

var path = require('path');
var fs = require('fs')
var _ = require('lodash');
var requireAll = require('require-all');
var async = require('async');
var rc = require('rc');
var env = require('./env.js');
var hooks = require('./hooks');
var events = require('./events');
var db = require('./database');

module.exports = {
  loadModels: function loadModels(we, cb) {
    var models = {};
    async.parallel([
      function loadPluginModels(done) {
        var pluginNames = Object.keys(we.plugins);
        async.each(pluginNames, function(pluginName, next) {
          if (!we.plugins[pluginName].models) return next();
          _.merge(models, we.plugins[pluginName].models);
          next();
        }, done);
      },
      function loadProjectModels(done) {
        var PMP = path.resolve(we.projectPath, 'server', 'models');
        fs.exists(PMP, function (exists) {
          // this project dont have models and the models folder
          if (!exists) return done();
          // load and merge all models
          _.merge(models, requireAll({
            dirname     :  PMP,
            filter      :  /(.+)\.js$/,
            resolve     : function (Model) {
              return Model(db, hooks, events);
            }
          }));
          done();
        });
      }
    ], function (err) {
      return cb(err, models);
    });
  },

  loadControllers: function loadControllers(we, cb) {
    var controllers = {};
    async.parallel([
      function loadPluginControllers(done) {
        async.each(we.pluginPaths, function(npm_module_path, next) {
          var PMP = path.resolve(npm_module_path, 'server', 'controllers')
          fs.exists(PMP, function(exists) {
            // this plugin dont have controlles and the controlles folder
            if (!exists) return next();
            // load and merge all controllers            
            _.merge(controllers, requireAll({
              dirname     :  PMP,
              filter      :  /(.+)\.js$/
            }));

            next();
          });
        }, function(err){
          return done(err);
        });
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
      return cb(err, controllers);
    });
  }
}
