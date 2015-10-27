/**
 * We.js database module
 *
 * This file load default database logic with sequelize
 */

var Sequelize = require('sequelize');
var async = require('async');
var env = require('../env.js');
var _ = require('lodash');
var log = require('../log')();
var router = require('../router');

var loadDatabaseConfig = require('./loadDatabaseConfig.js');

var db = {};

db.loadDatabaseConfig = loadDatabaseConfig;

db.defaultConnection = null;

db.models = {};

db.modelsConfigs = {};

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
      paranoid:   false,

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
            include: [{ all: true }]
          }).then(function (record) {
            res.locals.data = record;
            if (record && record.dataValues.creatorId && req.isAuthenticated()) {
              // ser role owner
              if (record.isOwner(req.user.id)) {
                if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner');
              }
            }

            return done();
          })
        }
      },
      instanceMethods: {
        isOwner: function isOwner(uid) {
          if (uid == this.creatorId) return true;
          return false;
        },
        toJSON: function toJSON() {
          var obj = this.get();
          delete obj.deletedAt;
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
        },

        /**
         * Default get url path instance method
         *
         * @return {String} url path
         */
        getUrlPath: function getUrlPath() {
          return router.urlTo(
            this.__options.name.singular + '.findOne', [this.id]
          );
        },
        /**
         * Get url path with suport to url alias
         *
         * @return {String} url path
         */
        getUrlPathAlias: function getUrlPathAlias() {
          var p = this.getUrlPath();
          return router.alias.forPath(p) || p;
        },

        /**
         * return model path with request
         * Try to use the getUrlPath if possible
         *
         * @param  {Object} req express request
         * @return {String}     url path
         */
        getPath: function getPath(req) {
          if (!req) throw new Error('Request is required in record.getPath()');
          return req.we.router.urlTo(
            this.__options.name.singular + '.findOne', req.paramsArray.concat([this.id])
          );
        },
        getLink: function getLink(req) {
          if (!req) throw new Error('Request is required in record.getLink()');
          return req.we.config.hostname + this.getPath(req);
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
 * Load we.js core models: system
 *
 * @return {Object} models db.models var
 */
db.loadCoreModels = function loadCoreModels(done) {
  //  system / plugins table
  db.models.plugin = db.define('plugin', {
    filename: {
      comment: 'plugin.js file',
      type: Sequelize.STRING(1000),
      allowNull: false
    },
    name: {
      comment: 'plugin name',
      type: Sequelize.STRING,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(12),
      defaultValue: 'plugin',
      allowNull: false
    },
    status: {
      comment: 'status, 1 for enabled',
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    version: {
      comment: 'last version of plugin models in database',
      type: Sequelize.STRING(10),
      defaultValue: '0.0.0',
      allowNull: false
    },
    weight: {
      comment: 'plugin weight how controll plugin load order',
      type: Sequelize.INTEGER(5),
      defaultValue: 0,
      allowNull: false
    },
    info: {
      type: Sequelize.TEXT
    }
  });

  // TODO add system config table

  async.parallel([
    function syncPluginTable(next) {
      db.models.plugin.sync()
      .then(function(){
        next();
      }).catch(next);
    }
  ], done);
}

/**
 * Sync all db models | create table if now exists
 *
 * @param  {Object} cd configuration optional
 * @param  {Function} cb callback optional
 */
db.syncAllModels = function syncAllModels(cd, cb) {
  if (cd && !cb) {
    cb = cd;
    cd = null;
  }
  // cd and cb is optional
  if (!cb) cb = function(){ };

  if (env == 'test' || (env != 'prod' && cd && cd.resetAllData)) {
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
        console.log('Error on setModelAllJoins 2: ', db.models[attrConfig.model]);
        throw e;
      }
    }
  }
}

module.exports = db;