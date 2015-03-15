/**
 * We.js database controllers
 *
 * This file load default database config, and core models
 */

var Sequelize = require('sequelize');
var async = require('async');
var path = require('path');
var env = require('../env.js');
var _ = require('lodash');

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

  // set we.js core define config
  _.merge(configs, {
    define: {
      // table configs
      timestamps: true,
      createdAt:  'createdAt',
      updatedAt:  'updatedAt',
      deletedAt:  'deletedAt',
      paranoid:   true,

      instanceMethods: {
        toJSON: function() {
          var obj = this.get();
          return obj;
        },
        fetchAssociatedIds: function(cb) {
          var sql = '';

          //console.log('fetchAssociatedIds.this', this);
          var modelName = this.__options.name.singular;
          var associations = db.models[modelName].associations;

          for (var associationName in associations ) {
            // get bellongs to from values id
            if ( associations[associationName].associationType == 'BelongsTo' ) {
              this.dataValues[associationName] = this.dataValues[ associations[associationName].identifier ];
            } else {
              console.log('fetchAssociatedIds unknow join>>', associations);
            }
          }

          cb();
        }
      }
    }
  });

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
    db.models[modelName].sync().done(function(){
      next()
    })
  }, cb);
}

db.setModelAllJoins = function setModelAllJoins() {
  var attrConfig;

  for ( var modelName in db.modelsConfigs) {

    for (var attributeName in db.modelsConfigs[modelName].associations) {
      attrConfig = db.modelsConfigs[modelName].associations[attributeName];

      db.models[modelName][attrConfig.type]( db.models[attrConfig.model], {
        as: attributeName
      });
    }
  }
}

// - init
db.defaultConnection = db.connect(env);
db.loadCoreModels();

module.exports = db;