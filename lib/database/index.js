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
db.define = function defineModel(name, configs) {
  return db.defaultConnection.define(name, {
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

db.syncAllModels = function syncAllModels(cb) {

  async.series([
    function syncConfiguration(next) {
      db.models.sys_configuration
      .sync()
      .done(next);
    },
    // function syncPlugin(next) {
    //   we.models.sys_configuration.sync().then(next);
    // },      
  ], cb);

}


// - init
db.defaultConnection = db.connect(env);
db.loadCoreModels();

module.exports = db;