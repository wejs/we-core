/**
 * We.js database controllers
 *
 * This file load default database config, and core models
 */

var Sequelize = require('sequelize');
var async = require('async');
var path = require('path');
var env = require('../env.js');

var loadDatabaseConfig = require('./loadDatabaseConfig.js');

var db = {};

db.defaultConnection = null;

db.models = {};

db.modelsConfigs = null;

db.Sequelize = Sequelize;

db.projectFolder = process.cwd();

/**
 * Connect in database
 * 
 * @param  {object} we 
 * @return {object} sequelize database connection
 */
db.connect = function connect() {
  var dbC = loadDatabaseConfig( db.projectFolder );
  var configs = dbC[env];
  return new Sequelize( dbC.database, dbC.username, dbC.password, configs ); 
}

/**
 * we.js db define | is a alias to current sequelize connection define
 * 
 * @param  {String} name    model name
 * @param  {object} configs model configs
 * @return {Object}         sequelize model
 */
db.define = function defineModel(name, definition, options) {
  return db.defaultConnection.define(name, definition, options);
}

/**
 * Load we.js core models
 * 
 * @return {Object} models db.models var
 */
db.loadCoreModels = function loadCoreModels() {
  // - sys_configuration model
  db.models.user_configuration = db.define('user_configuration', {
    name: {
      type: Sequelize.STRING
    },
    value: {
      type: Sequelize.STRING
    }
  }, {
    // Model tableName will be the same as the model name
    freezeTableName: true
  });

  return db.models;
}

/**
 * Sync all db models | create table if now exists
 * 
 * @param  {Function} cb callback
 */
db.syncAllModels = function syncAllModels(cb) {
  // cb is optional
  if (!cb) cb = function(){};

  var modelNames = Object.keys(db.modelsConfigs);
  async.each(modelNames, function(modelName, next) {
    db.models[modelName].sync().then(function(){
      next()
    })
  }, cb);
}


// - init
db.defaultConnection = db.connect(env);
db.loadCoreModels();

module.exports = db;