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
  loadStaticConfigs: function(we, cb) {
    var configs = {};

    async.parallel([
      // load each plugin config
      function loadPluginConfigs(done) {
        var pluginNames = Object.keys(we.plugins);
        async.each(pluginNames, function(pluginName, next) {
          var plugin = we.plugins[pluginName];
          if (!plugin.configs) return next();
          _.merge(configs, plugin.configs);
          next();
        }, function (err) {
          return done(err);
        })
      },

      function loadProjectConfigs(done) {
        var projectConfigFolder = path.resolve( we.projectPath, 'config' );

        fs.exists(projectConfigFolder, function(exists) {
          if (!exists) return done();

          fs.readdir(projectConfigFolder, function(err, files) {
            if (err) return done(err);
            var file;
            for (var i = 0; i < files.length; i++) {
              if (files[i] == 'local.js') continue;
              file = path.resolve(projectConfigFolder, files[i]);
              // skip dirs
              if (fs.lstatSync(file).isDirectory()) continue;
              
              _.merge(configs, require(file));
            };

            // load local.js after others configs
            var localConfigFile = path.resolve(projectConfigFolder,'local.js');
            if (fs.existsSync(localConfigFile) ) {
              _.merge(configs, require(localConfigFile));
            }

            done();
          });
        });
      }
    ], function(err) {
      cb(err, configs);
    });
  },

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
