/**
 * We.js database module
 *
 * This file load default database logic with sequelize
 */

const Sequelize = require('sequelize'),
  _ = require('lodash')

function Database (we) {
  this.we = we
  this.env = we.env
  let db = this

  this.defaultConnection = null
  this.models = {}
  this.modelsConfigs = {}
  this.modelHooks = {}
  this.modelClassMethods = {}
  this.modelInstanceMethods = {}

  this.Sequelize = Sequelize
  this.projectFolder = process.cwd()

  this.defaultModelDefinitionConfigs = {
    define: {
      // table configs
      timestamps: true,
      createdAt:  'createdAt',
      updatedAt:  'updatedAt',
      deletedAt:  'deletedAt',
      paranoid:   false,
      // enable we.js url alias for all models by default
      // change this config in your model to false to disable
      enableAlias: true,

      classMethods: {
        /**
         * Context loader, preload current request record and related data
         *
         * @param  {Object}   req  express.js request
         * @param  {Object}   res  express.js response
         * @param  {Function} done callback
         */
        contextLoader: function contextLoader (req, res, done) {
          if (!res.locals.id || !res.locals.loadCurrentRecord) return done()

          return this.findOne({
            where: { id: res.locals.id },
            include: [{ all: true }]
          })
          .then(function afterLoadContextRecord (record) {
            res.locals.data = record

            if (record && record.dataValues.creatorId && req.isAuthenticated()) {
              // ser role owner
              if (record.isOwner(req.user.id)) {
                if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner')
              }
            }

            return done()
          })
          .catch(done)
        }
      },
      instanceMethods: {
        /**
         * Default method to check if user is owner
         */
        isOwner: function isOwner (uid) {
          if (uid == this.creatorId) return true
          return false
        },

        /**
         * Function to run after send records in response
         * Overryde this function to remove private data
         *
         * @return {Object}
         */
        toJSON: function toJSON () {
          return this.get()
        },

        /**
         * Default function to set all associated model ids changing associations from objects array to ids array
         *
         * @param  {Function} cb callback
         */
        fetchAssociatedIds: function fetchAssociatedIds (cb) {
          let modelName = this.$modelOptions.name.singular
          let associations = db.models[modelName].associations

          for (let associationName in associations ) {
            // get bellongs to from values id
            if ( associations[associationName].associationType == 'BelongsTo' ) {
              this.dataValues[associationName] = this.dataValues[ associations[associationName].identifier ]
            } else {
              we.log.verbose('db.connect:fetchAssociatedIds unknow join: ', associations)
            }
          }
          cb()
        },

        /**
         * Default get url path instance method
         *
         * @return {String} url path
         */
        getUrlPath: function getUrlPath() {
          return we.router.urlTo(
            this.$modelOptions.name.singular + '.findOne', [this.id]
          )
        },
        /**
         * Get url path with suport to url alias
         *
         * @return {String} url path
         */
        getUrlPathAlias: function getUrlPathAlias() {
          if (we.router.alias) {
            // with url alias
            let p = this.getUrlPath()
            return ( we.router.alias.forPath(p) || p )
          } else {
            // without url alias
            return this.getUrlPath()
          }
        },
        /**
         * return model path with request
         * Try to use the getUrlPath if possible
         *
         * @param  {Object} req express request
         * @return {String}     url path
         */
        getPath: function getPath (req) {
          if (!req) throw new Error('Request is required in record.getPath()');
          return req.we.router.urlTo(
            this.$modelOptions.name.singular + '.findOne', req.paramsArray.concat([this.id])
          );
        },
        getLink: function getLink (req) {
          if (!req) throw new Error('Request is required in record.getLink()')
          return req.we.config.hostname + this.getPath(req)
        }
      }
    }
  }
}

/**
 * Connect in database
 *
 * @param  {object} we
 * @return {object} sequelize database connection
 */
Database.prototype.connect = function connect() {
  let dbC = this.we.config.database
  let configs = dbC[this.env]

  this.activeConnectionConfig = configs

  // set we.js core model definition configs
  _.merge(configs, this.defaultModelDefinitionConfigs)

  if (!configs.logging && configs.logging !== false) {
    configs.logging = this.we.log.debug
  }

  // connect with uri or with username and pass
  // See: http://sequelize.readthedocs.org/en/latest/api/sequelize/
  if (configs.uri) {
    return new Sequelize( configs.uri, configs )
  } else {
    return new Sequelize( configs.database, configs.username, configs.password, configs )
  }
}

/**
 * we.js db define | is a alias to current sequelize connection define
 *
 * @param  {String} name    model name
 * @param  {object} configs model configs
 * @return {Object}         sequelize model
 */
Database.prototype.define = function defineModel (name, definition, options) {
  return this.defaultConnection.define(name, definition, options)
}

/**
 * Load we.js core models: system
 *
 * @return {Object} models db.models var
 */
Database.prototype.loadCoreModels = function loadCoreModels (done) {
  let log = this.we.log
  let db = this

  //  system / plugins table
  this.models.plugin = this.define('plugin', {
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
  })


  db.models.plugin.sync()
  .then(function(){
    done();
  })
  .catch(function errorOnSyncCoreModels (err) {
    // database connection error
    if (err.name == 'SequelizeAccessDeniedError') {
      console.log('database access error')
      log.warn('Cannot connect to the database')
      log.warn(`This behavior occurs if one of the following conditions is true:
  1. The SQL database is not running or you need to create the database.
  2. The account that is used by the project in locals/config.js file does not have the required permissions to the database server.

Check the database documentation in http://wejs.org site`)

      log.verbose('Error: ', err)

      process.exit()
    }
    // unknow error ...
    done(err)
  });
}

/**
 * Sync all db models | create table if now exists
 *
 * @param  {Object} cd configuration optional
 * @param  {Function} cb callback optional
 */
Database.prototype.syncAllModels = function syncAllModels (cd, cb) {
  if (cd && !cb) {
    cb = cd
    cd = null
  }
  // cd and cb is optional
  if (!cb) cb = function(){ }

  if (this.env == 'test' || (this.env != 'prod' && cd && cd.resetAllData)) {
    this.defaultConnection.sync({force: true}).then(function(){ cb(); }).catch(cb)
  } else {
    this.defaultConnection.sync().then(function(){ cb(); }).catch(cb)
  }
}

/**
 * Set all models associations
 */
Database.prototype.setModelAllJoins = function setModelAllJoins () {
  let attrConfig

  for ( let modelName in this.modelsConfigs) {

    for (let attributeName in this.modelsConfigs[modelName].associations) {
      attrConfig = this.modelsConfigs[modelName].associations[attributeName]
      // skip if are emberOnly
      if (attrConfig.emberOnly) continue

      let config = {
        scope: attrConfig.scope
      };

      config.as = attributeName

      if (attrConfig.through) {
        if (typeof attrConfig.through == 'object') {
          config.through = attrConfig.through
          config.through.model = this.models[attrConfig.through.model]
        } else {
          config.through = attrConfig.through
        }
      }

      if (attrConfig.onDelete) config.onDelete = attrConfig.onDelete
      if (attrConfig.onUpdate) config.onUpdate = attrConfig.onUpdate
      if (attrConfig.constraints === false) config.constraints = false
      if (attrConfig.otherKey) config.otherKey = attrConfig.otherKey
      if (attrConfig.foreignKey) config.foreignKey = attrConfig.foreignKey

      try {
        this.models[modelName][attrConfig.type]( this.models[attrConfig.model], config)
      } catch(e) {
        console.log('Error on setModelAllJoins 2: ', attrConfig.model, this.models[attrConfig.model])
        throw e;
      }
    }
  }
}

/**
 * Set model hooks from hook configuration in json model
 */
Database.prototype.setModelHooks = function setModelHooks() {
  let db = this
  let hookFNName

  let modelNames = Object.keys(db.modelsConfigs)

  modelNames
  .filter(mn => { return db.modelsConfigs[mn].hooks })
  .forEach(function setHook (mn) {
    let hooks = db.modelsConfigs[mn].hooks, hname, i, fns

    for (hname in hooks) {
      // hooks may be defined with arrays or objects
      if (_.isArray(hooks[hname])) {
        fns = hooks[hname]
      } else {
        fns = Object.keys(hooks[hname])
      }

      // is array
      for (i = 0; i < fns.length; i++) {
        hookFNName = fns[i]

        if (!db.modelHooks[hookFNName]) {
          db.we.log.warn('db.setModelHooks: model hook function not found', hookFNName)
        } else {
          db.models[mn]
          .addHook(hname, hookFNName+'_'+i, db.modelHooks[hookFNName] )
        }

      }
    }
  });
}

/**
 * Set model class methods from classMethods configuration in json model
 */
Database.prototype.setModelClassMethods = function setModelClassMethods () {
  let db = this
  let fnName

  let modelNames = Object.keys(db.modelsConfigs);

  modelNames
  .filter((mn) => { return db.modelsConfigs[mn].classMethods })
  .forEach(function setHook (mn) {
    let clName
    let cms = db.modelsConfigs[mn].classMethods

    if (!db.modelsConfigs[mn].options)
      db.modelsConfigs[mn].options = {}
    if (!db.modelsConfigs[mn].options.classMethods)
      db.modelsConfigs[mn].options.classMethods = {}

    for (clName in cms) {
      fnName = cms[clName]

      if (!db.modelClassMethods[fnName]) {
        db.we.log.warn('db.setModelClassMethods: model classMethod function not found', fnName)
      } else {
        db.modelsConfigs[mn].options.classMethods[clName] = db.modelClassMethods[fnName]
      }
    }
  })
}

/**
 * Set model instance methods from instanceMethods configuration in json model
 */
Database.prototype.setModelInstanceMethods = function setModelInstanceMethods() {
  let db = this
  let fnName

  let modelNames = Object.keys(db.modelsConfigs)

  modelNames
  .filter(mn => { return db.modelsConfigs[mn].instanceMethods })
  .forEach(function setHook (mn) {
    let clName
    let ims = db.modelsConfigs[mn].instanceMethods

    if (!db.modelsConfigs[mn].options.instanceMethods)
      db.modelsConfigs[mn].options.instanceMethods = {}

    for (clName in ims) {
      fnName = ims[clName]

      if (!db.modelInstanceMethods[fnName]) {
        db.we.log.warn('db.setModelInstanceMethods: model instanceMethod function not found', fnName)
      } else {
        db.modelsConfigs[mn].options.instanceMethods[clName] = db.modelInstanceMethods[fnName]
      }
    }
  })
}
/**
 * Check records privacity
 *
 * @param  {Object|Array} data records
 */
Database.prototype.checkRecordsPrivacity = function checkRecordsPrivacity (data) {
  if (_.isArray(data)) {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].privacity) {
        this.checkPrivacity(data[i]);
      }
    }
  } else if(data.privacity) {
    this.checkPrivacity(data);
  }
}

/**
 * Check records privacity fields
 *
 * @param  {Object} data record
 */
Database.prototype.checkPrivacity = function checkPrivacity (obj) {
  for (let i = obj.privacity.length - 1; i >= 0; i--) {
    if (obj.privacity[i].privacity == 'private') {
      delete obj.dataValues[obj.privacity[i].field];
    }

    if (_.isArray(obj[i])) {
      for (let j = obj[i].length - 1; j >= 0; j--) {
        if (obj[i][j].privacity && obj[i][j].dataValues) {
          this.checkPrivacity(obj[i][j]);
        }
      }
    }
  }
}

Database.prototype.defineModelFromJson = require('./defineModelFromJson.js');

module.exports = Database;