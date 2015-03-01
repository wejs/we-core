/**
 * We.js config and resouces loader
 */

var path = require('path');
var fs = require('fs')
var _ = require('lodash');
var requireAll = require('require-all');
var async = require('async');
var rc = require('rc');

module.exports = {
  enviroment: function loadEnviromentConfig(we) {
    switch(process.env.NODE_ENV){
      case 'prod':
        return 'prod';
      case 'test':
        return 'test';        
      default:
        return 'dev';
    }
  },
  /**
   * Helper function to load database configs
   * 
   * @param  {object} we we.js object
   * @return {object}    database config object
   */
  databaseConfig: function loadDatabaseConfig(we) {
    var dbFileConfigs;
    // default config
    var dbConfigs = {
      prod: null,
      dev: {
        dialect:  'sqlite',
        storage: path.resolve( we.projectPath, 'files/sqlite/dev.sqlite' )
      },
      test: {
        dialect:  'sqlite',
        storage: path.resolve( we.projectPath, 'files/sqlite/test.sqlite' )
      }
    };

    // try to load database configs from project database config
    try {
      dbFileConfigs = require( path.resolve( we.projectPath, 'configs', 'database.js' ));
      _.merge(dbConfigs, dbFileConfigs);
    } catch(e) {
      if (e.code != 'MODULE_NOT_FOUND' ) {
        we.log.error('Unknow error on load database config:', e);  
      }
      var mkdirp = require('mkdirp');
      mkdirp( path.resolve( we.projectPath, 'files', 'sqlite') , function (err) {
        if (err) throw new Error(err);
      });
    }
    return dbConfigs;
  },

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

  loadPluginConfig: function loadPluginConfig(we) {
    var config = {
      // if set enableAll to true we.js ignore the enabled config and will load all plugins on npm_module folder
      enableAll: true,
      enabled: []
    };;

    // try to load database configs from project database config
    try {
      pluginFileConfigs = require( path.resolve( we.projectPath, 'configs', 'plugins.js' ));
      _.merge(config, pluginFileConfigs);
    } catch(e) {
      if (e.code != 'MODULE_NOT_FOUND' ) {
        we.log.error('Unknow error on load plugin configs:', e);  
      }
      // project plugin config file not found
    }
    return config;
  },
  /**
   * Load and register all avaible plugins
   * 
   * @param  {object}   we we.js object
   * @param  {Function} cb callback
   */
  registerPlugins: function registerPlugins(we, cb) {
    var nodeModulesPath = path.resolve( we.projectPath, 'node_modules');

    var plugins = {};

    fs.readdir(nodeModulesPath, function(err, files) {
      if (err) return cb(err);

      async.each(files, function (npm_module_name, next) {
        var pluginPath = path.resolve(nodeModulesPath, npm_module_name);
        // only load the plugin is valid and is enabled
        if (pluginIsEnabled(we, npm_module_name) && isPlugin(pluginPath) ) {
          var pluginFile = path.resolve( pluginPath, 'plugin.js' );
          plugins[npm_module_name] = require(pluginFile)(we);
          plugins[npm_module_name].pluginPath = pluginPath;
          plugins[npm_module_name].pluginFile = pluginFile;
          // run plugin onLoad function if exists
          if (typeof plugins[npm_module_name].onLoad != 'function') return next();
          plugins[npm_module_name].onLoad(we, next);
        } else {
          next();
        }
      }, function (err) {
        cb(err, plugins);  
      });
    });
  },

  loadModels: function loadModels(we, cb) {
    var models = {};
    async.parallel([
      function loadPluginModels(done) {
        async.each(we.pluginPaths, function(npm_module_path, next) {
          var PMP = path.resolve(npm_module_path, 'server', 'models')
          fs.exists(PMP, function(exists) {
            // this plugin dont have models and the models folder
            if (!exists) return next();
            // require and merge all models
            _.merge(models, requireAll({
              dirname     :  PMP,
              filter      :  /(.+)\.js$/
            }));

            next();
          });
        }, function (err) {
          return done(err);
        });
      },
      function loadProjectModels(done) {
        var PMP = path.resolve(we.projectPath, 'server', 'models');
        fs.exists(PMP, function(exists) {
          // this project dont have models and the models folder
          if (!exists) return done();
          // load and merge all models
          _.merge(models, requireAll({
            dirname     :  PMP,
            filter      :  /(.+)\.js$/
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

/**
 * Helper to check if a npm module is a plugin
 * 
 * @param  {string}  node_module_path 
 * @return {Boolean}                  
 */
function isPlugin(node_module_path) {
  if (fs.statSync( node_module_path ).isDirectory() ) {
    if ( fs.existsSync( path.resolve( node_module_path, 'plugin.js' ) ) ) {
      return true;  
    }
  }
  return false;
}

/**
 * Check if a plugin is enabled
 * 
 * @param  {object} we              we.js object
 * @param  {string} npm_module_name 
 * @return {boolean}                 
 */
function pluginIsEnabled(we, npm_module_name) {
  if (we.pluginConfigs.enableAll) return true;
  if (we.pluginConfigs.indexOf(npm_module_name) > 0 ) return true;
  return false;
}
