/**
 * We.js config and resouces loader
 */

var path = require('path');
var fs = require('fs')
var _ = require('lodash');
var requireAll = require('require-all');
var async = require('async');
var EmailTemplate = require('./email/EmailTemplate.js');
var Controller = require('./class/Controller.js');

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
            resolve     : function (model) {
              return model(we);
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
        var pluginNames = Object.keys(we.plugins);
        async.each(pluginNames, function(pluginName, next) {
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
  },

  loadEmailTemplates: function loadEmailTemplates(we, cb) {
    var templates = {};
    async.parallel([
      function loadPluginEmailTemplates(done) {
        try {
          async.each(we.pluginPaths, function(npmModulePath, next) {
            var PMP = path.resolve(npmModulePath, 'server', 'emails');
            fs.readdir(PMP, function(err, paths) {
              if (err) {
                if (err.code != 'ENOENT') {
                  return next(err);
                } else {
                  return next()
                }
              }
              for (var i = paths.length - 1; i >= 0; i--) {
                templates[paths[i]] = new EmailTemplate(PMP, paths[i]);
              }

              next();
            });
          }, function(err){
            return done(err);
          });
        } catch(e) {
          done();
        }
      },
      function loadProjectEmailTemplates(done) {
        var PMP = path.resolve(we.projectPath, 'server', 'emails');
        fs.readdir(PMP, function(err, paths) {
          if (err) {
            if (err.code != 'ENOENT') {
              return done(err);
            } else {
              return done()
            }
          }

          for (var i = paths.length - 1; i >= 0; i--) {
            templates[paths[i]] = new EmailTemplate(PMP, paths[i]);
          }

          done();
        });
      }
    ], function (err) {
      return cb(err, templates);
    });
  }
}
