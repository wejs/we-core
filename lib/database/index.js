/**
 * We.js database controllers
 *
 * This file load default database config, and core models
 */

var Sequelize = require('sequelize');
var env = require('../env.js');
var _ = require('lodash');
var log = require('../log')();

var loadDatabaseConfig = require('./loadDatabaseConfig.js');

var db = {};

db.loadDatabaseConfig = loadDatabaseConfig;

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

  db.activeConnectionConfig = configs;

  // set we.js core define config
  _.merge(configs, {
    define: {
      // table configs
      timestamps: true,
      createdAt:  'createdAt',
      updatedAt:  'updatedAt',
      deletedAt:  'deletedAt',
      paranoid:   true,

      classMethods: {
        /**
         * Context loader, preload current request record and related data
         *
         * @param  {Object}   req  express.js request
         * @param  {Object}   res  express.js response
         * @param  {Function} done callback
         */
        contextLoader: function contextLoader(req, res, done) {
          if (!res.locals.id || !res.locals.loadCurrentRecord) return done();

          return this.find({
            where: { id: res.locals.id},
            include: [{ all: true,  attributes: ['id'] }]
          }).then(function (record) {
            res.locals.record = record;
            if (record && record.dataValues.creatorId && req.isAuthenticated()) {
              // ser role owner
              if (req.user.id == record.dataValues.creatorId)
                if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner');
            }

            return done();
          })
        }
      },

      instanceMethods: {
        toJSON: function toJSON() {
          var obj = this.get();
          return obj;
        },
        fetchAssociatedIds: function fetchAssociatedIds(cb) {
          var modelName = this.__options.name.singular;
          var associations = db.models[modelName].associations;

          for (var associationName in associations ) {
            // get bellongs to from values id
            if ( associations[associationName].associationType == 'BelongsTo' ) {
              this.dataValues[associationName] = this.dataValues[ associations[associationName].identifier ];
            } else {
              log.verbose('db.connect:fetchAssociatedIds unknow join: ', associations);
            }
          }
          cb();
        }
      }
    }
  });

  return new Sequelize( configs.database, configs.username, configs.password, configs );
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
db.syncAllModels = function syncAllModels(cd, cb) {
  if (cd && !cb) {
    cb = cd;
    cd = null;
  }
  // cb is optional
  if (!cb) cb = function(){};

  if (env == 'test' || (env != 'prod' && cd.resetAllData)) {
    db.defaultConnection.sync({force: true}).then(function(){ cb(); }).catch(cb);
  } else {
    db.defaultConnection.sync().then(function(){ cb(); }).catch(cb);
  }
}

db.setModelAllJoins = function setModelAllJoins() {
  var attrConfig;

  for ( var modelName in db.modelsConfigs) {

    for (var attributeName in db.modelsConfigs[modelName].associations) {
      attrConfig = db.modelsConfigs[modelName].associations[attributeName];
      // skip if are emberOnly
      if (attrConfig.emberOnly) continue;

      var config = {};
      config.as = attributeName;

      if (attrConfig.through) {
        if (typeof attrConfig.through == 'object') {
          config.through = attrConfig.through;
          config.through.model = db.models[attrConfig.through.model];
        } else {
          config.through = attrConfig.through;
        }
      }

      if (attrConfig.otherKey) config.otherKey = attrConfig.otherKey;
      if (attrConfig.onDelete) config.onDelete = attrConfig.onDelete;
      if (attrConfig.onUpdate) config.onUpdate = attrConfig.onUpdate;
      if (attrConfig.constraints === false) config.constraints = false;
      if (attrConfig.otherKey) config.otherKey = attrConfig.otherKey;
      if (attrConfig.foreignKey) config.foreignKey = attrConfig.foreignKey;

      try {
        db.models[modelName][attrConfig.type]( db.models[attrConfig.model], config);
      } catch(e) {
        console.error('Error on setModelAllJoins: ', e);
        console.verbose('Error on setModelAllJoins 2: ', db.models[attrConfig.model]);
      }
    }
  }
}

// - init
db.defaultConnection = db.connect(env);
db.loadCoreModels();

module.exports = db;