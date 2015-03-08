/**
 * Static configs loader
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var pluginManager = require('../pluginManager');

/**
 * Config cache
 * @type {Object}
 */
configs = {};

module.exports = function init(projectPath) {
  // return configs if is load
  if (! _.isEmpty(configs) ) return configs;

  // - load and merge plugin configs
  // 

  var pluginNames = Object.keys(pluginManager.plugins);

  for (var pluginName in pluginManager.plugins) {
    var plugin = pluginManager.plugins[pluginName];
    _.merge(configs, plugin.configs);
  }

  // - load and merge project configs
  //
  
  if (!projectPath) projectPath = process.cwd();

  var projectConfigFolder = path.resolve( projectPath, 'config' );
  var cfgs = {};

  var files = fs.readdirSync(projectConfigFolder);

  var file;
  for (var i = 0; i < files.length; i++) {
    if (files[i] == 'local.js') continue;
    file = path.resolve(projectConfigFolder, files[i]);
    // skip dirs
    if (fs.lstatSync(file).isDirectory()) continue;
    
    _.merge(configs, require(file));
  };

  // load local.js after others configs
  var localConfigFile = path.resolve(projectConfigFolder, 'local.js');
  
  // load project local config file
  _.merge(configs, require(localConfigFile));

  return configs;
};  




// /**
//  * Load and parse all db configs
//  * 
//  * @param  {Function} cb callback
//  */
// configs.loadAllFromDB = function loadAllFromDB(cb) {
//   db.models.sys_configuration.findAll()
//   .done(function(err, results){
//     if (err) return cb(err);
    
//     // TODO parse db configs ...
//     we.log.debug('Configs found in db:',results);

//     cb();
//   });
// }

