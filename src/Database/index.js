/**
 * We.js database module
 *
 * This file load default database logic with sequelize
 */

const Sequelize = require('sequelize'),
      lodash = require('lodash'),
      defaultsDeep = lodash.defaultsDeep,
      isArray = lodash.isArray,
      clone = lodash.clone;

function Database (we) {
  this.we = we;
  this.env = we.env;
  let db = this;

  this.defaultConnection = null;
  this.models = {};
  this.modelsConfigs = {};
  this.modelHooks = {};
  this.modelClassMethods = {};
  this.modelInstanceMethods = {};

  this.Sequelize = Sequelize;
  we.Op = Sequelize.Op;

  this.projectFolder = process.cwd();

  this.defaultModelDefinitionConfigs = {
    dialect: 'mysql', // default mysql dialect
    operatorsAliases: false,

    define: {
      // table configs
      timestamps: true,
      createdAt:  'createdAt',
      updatedAt:  'updatedAt',
      deletedAt:  'deletedAt',
      paranoid:   false,
      // enable we.js url alias for all models by default
      // change this config in your model to false to disable
      enableAlias: true
    }
  };

  this.defaultClassMethods = {
    /**
     * Context loader, preload current request record and related data
     *
     * @param  {Object}   req  express.js request
     * @param  {Object}   res  express.js response
     * @param  {Function} done callback
     */
    contextLoader(req, res, done) {
      if (!res.locals.id || !res.locals.loadCurrentRecord) return done();

      return this.findOne({
        where: { id: res.locals.id },
        include: [{ all: true }]
      })
      .then(function afterLoadContextRecord (record) {
        res.locals.data = record;

        if (record && record.dataValues.creatorId && req.isAuthenticated()) {
          // ser role owner
          if (record.isOwner(req.user.id)) {
            if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner');
          }
        }

        done();
        return null;
      })
      .catch(done);
    }
  };

  this.defaultInstanceMethods = {
    /**
     * Default method to check if user is owner
     */
    isOwner(uid) {
      if (uid == this.creatorId) return true;
      return false;
    },

    /**
     * Function to run after send records in response
     * Overryde this function to remove private data
     *
     * @return {Object}
     */
    toJSON() {
      return this.get();
    },

    getJSONAPIAttributes() {
      const modelName = this.getModelName(),
            attributeList = we.db.modelsConfigs[modelName].attributeList,
            attributes = {};

      for (let i = 0; i < attributeList.length; i++) {
        attributes[ attributeList[i] ] = this.get(attributeList[i]);
      }

      return attributes;
    },

    getJSONAPIRelationships() {
      const modelName = this.getModelName(),
            model = we.db.models[modelName],
            associationList = we.db.modelsConfigs[modelName].associationNames,
            relationships = {};

      for (let j = 0; j < associationList.length; j++) {

        let values = this.get(associationList[j]);

        if (values) {
          if (isArray(values)) {
            // NxN association
            relationships[ associationList[j] ] = this.getJSONAPINxNRelationship(
              associationList[j]
            );
          } else {

            // 1xN association
            relationships[ associationList[j] ] = {
              data: {
                id: this.getDataValue([associationList[j]]).id,
                type: model.associations[ associationList[j] ].target.name
              }
            };
          }
        }
      }

      return relationships;
    },

    getJSONAPINxNRelationship(assocName) {
      const assocs = [],
            modelName = this.getModelName(),
            model = we.db.models[modelName],
            type = model.associations[ assocName ].target.name,
            items = this.get(assocName);

      for (let i = 0; i < items.length; i++) {
        assocs.push({
          id: items[i].id,
          type: type
        });
      }

      return { data: assocs };
    },

    toJSONAPI() {
      const modelName = this.getModelName();

      let formated = {
        id: this.id,
        type: modelName,
        attributes: this.getJSONAPIAttributes(),
        relationships: this.getJSONAPIRelationships()
      };

      // delete the relationships key if is empty
      if (!Object.keys(formated.relationships).length) {
        delete formated.relationships;
      }

      return formated;
    },

    /**
     * Default function to set all associated model ids changing associations from objects array to ids array
     *
     * @param  {Function} cb callback
     */
    fetchAssociatedIds(cb) {
      const modelName = this.getModelName(),
            associations = db.models[modelName].associations;

      for (let associationName in associations ) {
        // get bellongs to from values id
        if ( associations[associationName].associationType == 'BelongsTo' ) {
          this.dataValues[associationName] = this.dataValues[ associations[associationName].identifier ];
        } else {
          we.log.verbose('db.connect:fetchAssociatedIds unknow join: ', associations);
        }
      }
      cb();
    },

    /**
     * Default get url path instance method
     *
     * @return {String} url path
     */
    getUrlPath() {
      return we.router.urlTo(
        this.getModelName() + '.findOne', [this.id]
      );
    },
    /**
     * Get url path with suport to url alias
     *
     * @return {String} url path
     */
    getUrlPathAlias() {
      if (we.router.alias) {
        // with url alias
        let p = this.getUrlPath();
        return ( we.router.alias.forPath(p) || p );
      } else {
        // without url alias
        return this.getUrlPath();
      }
    },
    /**
     * return model path with request
     * Try to use the getUrlPath if possible
     *
     * @param  {Object} req express request
     * @return {String}     url path
     */
    getPath(req) {
      if (!req) throw new Error('Request is required in record.getPath()');
      return req.we.router.urlTo(
        this.getModelName() + '.findOne', req.paramsArray.concat([this.id])
      );
    },
    getLink(req) {
      if (!req) throw new Error('Request is required in record.getLink()');
      return req.we.config.hostname + this.getPath(req);
    },
    /**
     * Get record model name
     *
     * @return {String}
     */
    getModelName() {
      return this.constructor.name;
    }
  };
}

Database.prototype = {
  /**
   * Connect in database
   *
   * @return {object} sequelize database connection
   */
  connect() {
    const configs = this.getDBConnectionConfigs();

    this.activeConnectionConfig = configs;

    // connect with uri or with username and pass
    // See: http://sequelize.readthedocs.org/en/latest/api/sequelize/
    if (configs.uri) {
      return new Sequelize( configs.uri, configs );
    } else {
      return new Sequelize( configs.database, configs.username, configs.password, configs );
    }
  },

  /**
   * Get database connection configuration
   * @return {Object} database configs
   */
  getDBConnectionConfigs() {
    const dbC = this.we.config.database;

    let configs = dbC[this.env];


    if (!configs) {
      this.we.log.error(`Database configuration not found for enviroment: ${this.env}`);

      return this.we.exit( ()=> {
        process.exit();
      });
    }

    // set we.js core model definition configs
    defaultsDeep(configs, this.defaultModelDefinitionConfigs);

    // disable database logging by deffault
    if (!configs || !configs.logging) {
      configs.logging = false;
    }

    return configs;
  },

  /**
   * we.js db define | is a alias to current sequelize connection define
   *
   * @param  {String} name    model name
   * @param  {object} configs model configs
   * @return {Object}         sequelize model
   */
  define(name, definition, options) {
    // suport for uuids:
    if (
      this.activeConnectionConfig.UUIDInAllModels &&
      !definition.id
    ) {
      definition.id = {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      };
    }

    let Model;

    try {
      Model = this.defaultConnection.define(name, definition, options);
    } catch(e) {
      console.log(e);
      console.log('name>', name);

      process.exit();
    }

    this.setDefinedModelClassMethods(Model, options);
    this.setDefinedModelInstanceMethods(Model, options);

    return Model;
  },

  setDefinedModelClassMethods(Model, options) {
    // first set default class methods:
    for (let name in this.defaultClassMethods) {
      Model[name] = this.defaultClassMethods[name];
    }

    if (!options || !options.classMethods) return;

    // this model only class methods:
    for (let name in options.classMethods) {
      Model[name] = options.classMethods[name];
    }
  },

  setDefinedModelInstanceMethods(Model, options) {
    if (!Model.prototype) Model.prototype = {};
    // first set default instance methods:
    for (let name in this.defaultInstanceMethods) {
      Model.prototype[name] = this.defaultInstanceMethods[name];
    }

    if (!options || !options.instanceMethods) return;

    // this model instance methods:
    for (let name in options.instanceMethods) {
      Model.prototype[name] = options.instanceMethods[name];
    }
  },

  /**
   * Load we.js core models: system
   *
   * @return {Object} models db.models var
   */
  loadCoreModels(done) {
    const db = this;

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
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      info: {
        type: Sequelize.TEXT
      }
    });

    return db.models.plugin.sync()
    .then( ()=> {
      done();
      return null;
    })
    .catch(done);
  },

  /**
   * Sync all db models | create table if now exists
   *
   * @param  {Object} cd configuration optional
   * @param  {Function} cb callback optional
   */
  syncAllModels(cd, cb) {
    if (cd && !cb) {
      cb = cd;
      cd = null;
    }
    // cd and cb is optional
    if (!cb) cb = function(){ };

    if (this.env == 'test' || (this.env != 'prod' && cd && cd.resetAllData)) {
      this.defaultConnection.sync({force: true}).nodeify(cb);
    } else {
      this.defaultConnection.sync().nodeify(cb);
    }
  },

  /**
   * Set all models associations
   */
  setModelAllJoins() {
    let attrConfig;

    for ( let modelName in this.modelsConfigs) {

      for (let attributeName in this.modelsConfigs[modelName].associations) {
        attrConfig = this.modelsConfigs[modelName].associations[attributeName];
        // skip if are emberOnly
        if (attrConfig.emberOnly) continue;

        let config = {
          scope: attrConfig.scope
        };

        config.as = attributeName;

        if (attrConfig.through) {
          if (typeof attrConfig.through == 'object') {
            config.through = attrConfig.through;
            config.through.model = this.models[attrConfig.through.model];
          } else {
            config.through = attrConfig.through;
          }
        }

        if (attrConfig.onDelete) config.onDelete = attrConfig.onDelete;
        if (attrConfig.onUpdate) config.onUpdate = attrConfig.onUpdate;
        if (attrConfig.constraints === false) config.constraints = false;
        if (attrConfig.otherKey) config.otherKey = attrConfig.otherKey;
        if (attrConfig.foreignKey) config.foreignKey = attrConfig.foreignKey;

        try {
          this.models[modelName][attrConfig.type]( this.models[attrConfig.model], config);
        } catch(e) {
          console.log('Error on setModelAllJoins 2: ', attrConfig.model, this.models[attrConfig.model]);
          throw e;
        }
      }
    }
  },

  /**
   * Set model hooks from hook configuration in json model
   */
  setModelHooks() {
    const db = this;
    let hookFNName;

    let modelNames = Object.keys(db.modelsConfigs);

    modelNames
    .filter(mn => { return db.modelsConfigs[mn].hooks; })
    .forEach(function setHook (mn) {
      let hooks = db.modelsConfigs[mn].hooks, hname, i, fns;

      for (hname in hooks) {
        // hooks may be defined with arrays or objects
        if (isArray(hooks[hname])) {
          fns = hooks[hname];
        } else {
          fns = Object.keys(hooks[hname]);
        }

        // is array
        for (i = 0; i < fns.length; i++) {
          hookFNName = fns[i];

          if (!db.modelHooks[hookFNName]) {
            db.we.log.warn('db.setModelHooks: model hook function not found', hookFNName);
          } else {
            db.models[mn]
            .addHook(hname, hookFNName+'_'+i, db.modelHooks[hookFNName] );
          }

        }
      }
    });
  },

  /**
   * Set model class methods from classMethods configuration in json model
   */
  setModelClassMethods() {
    const db = this;
    let fnName;

    let modelNames = Object.keys(db.modelsConfigs);

    modelNames
    .filter((mn) => { return db.modelsConfigs[mn].classMethods; })
    .forEach(function setHook (mn) {
      let clName;
      let cms = db.modelsConfigs[mn].classMethods;

      if (!db.modelsConfigs[mn].options)
        db.modelsConfigs[mn].options = {};
      if (!db.modelsConfigs[mn].options.classMethods)
        db.modelsConfigs[mn].options.classMethods = {};

      for (clName in cms) {
        fnName = cms[clName];

        if (!db.modelClassMethods[fnName]) {
          db.we.log.warn('db.setModelClassMethods: model classMethod function not found', fnName);
        } else {
          db.modelsConfigs[mn].options.classMethods[clName] = db.modelClassMethods[fnName];
        }
      }
    });
  },

  /**
   * Set model instance methods from instanceMethods configuration in json model
   */
  setModelInstanceMethods() {
    const db = this;
    let fnName;

    let modelNames = Object.keys(db.modelsConfigs);

    modelNames
    .filter(mn => { return db.modelsConfigs[mn].instanceMethods; })
    .forEach(function setHook (mn) {
      let clName;
      let ims = db.modelsConfigs[mn].instanceMethods;

      if (!db.modelsConfigs[mn].options.instanceMethods)
        db.modelsConfigs[mn].options.instanceMethods = {};

      for (clName in ims) {
        fnName = ims[clName];

        if (!db.modelInstanceMethods[fnName]) {
          db.we.log.warn('db.setModelInstanceMethods: model instanceMethod function not found', fnName);
        } else {
          db.modelsConfigs[mn].options.instanceMethods[clName] = db.modelInstanceMethods[fnName];
        }
      }
    });
  },

  /**
   * Check records privacity
   *
   * @param  {Object|Array} data records
   */
  checkRecordsPrivacity(data) {
    if (isArray(data)) {
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].privacity) {
          this.checkPrivacity(data[i]);
        }
      }
    } else if(data && data.privacity) {
      this.checkPrivacity(data);
    }
  },

  /**
   * Check records privacity fields
   *
   * @param  {Object} data record
   */
  checkPrivacity(obj) {
    for (let i = obj.privacity.length - 1; i >= 0; i--) {
      if (obj.privacity[i].privacity == 'private') {
        delete obj.dataValues[obj.privacity[i].field];
      }

      if (isArray(obj[i])) {
        for (let j = obj[i].length - 1; j >= 0; j--) {
          if (obj[i][j].privacity && obj[i][j].dataValues) {
            this.checkPrivacity(obj[i][j]);
          }
        }
      }
    }
  },

  /**
   * Build model config for definition from  JSON model config
   *
   * @param  {Object} model
   * @param  {Object} we
   * @return {Object}
   */
  defineModelFromJson (model, we) {
    return {
      definition: parseModelAttributes(model.attributes, we),
      associations: model.associations,
      options: ( model.options || {} ),
      hooks: model.hooks,
      classMethods: model.classMethods,
      instanceMethods: model.instanceMethods
    };
  },

  /**
   * Check database configuration and connection
   *
   * @param  {Object}   we
   * @param  {Function} cb callback
   */
  checkDBConnection(we, cb) {
    const log = this.we.log,
        db = this;

    // skip if is exiting ...
    if (this.we.isExiting) return;
    // try to connect in database for check if database configuration is right
    we.db.defaultConnection
    .authenticate()
    .nodeify(function afterCheckConnection (err) {
      if (!err) return cb(null, true); // all fine

      // handle database connection error:
      if (err.name == 'SequelizeAccessDeniedError') {
        log.warn('Cannot connect to the database');
        log.warn(`This behavior occurs if one of the following conditions is true:
    1. The SQL database is not running or you need to create the database.
    2. The account that is used by the project in config/local.js file does not have the required permissions to the database server.

  Check the database documentation in https://wejs.org site`);

        log.verbose('Error: ', err);

        process.exit();
      }
      // connected but database dont exists
      if (err.name == 'SequelizeConnectionError') {
        return db.tryToCreateDB(function (e, success) {
          if (e) return cb(e); // unknow error on try to create
          if (!success) return cb(err); // cant create
          cb(null, true); // success
        });
      }

      // unknow error
      cb(err);
    });
  },

  /**
   * Method for try to create one database on db with active connection and run db related queryes
   *
   * @param  {Function} cb callback
   */
  tryToCreateDB(cb) {
    const db = this,
        cfg = db.activeConnectionConfig;

    switch (cfg.dialect) {
      case 'mysql':
        return db.createMysqlDatabase(cb);
      case 'postgres':
        return db.createPostgreDatabase(cb);
      default:
        return cb();
    }
  },

  /**
   * Get mysqli or mysql lib
   *
   * @return {Object} npm mysqli or mysql lib
   */
  getMysqlLib() {
    try {
      // new improved mysql module:
      return require('mysqli');
    } catch(e) {
      // fallback to default mysql module:
      return require('mysql2');
    }
  },

  /**
   * Create one database on mysql dbs
   *
   * @param  {Function} cb callback
   */
  createMysqlDatabase(cb) {
    const db = this,
          cfg = db.activeConnectionConfig;

    const mysql = this.getMysqlLib();
    let connection, dbName;

    if (cfg.uri) {
      let uriParts = cfg.uri.split('/');
      dbName = uriParts.pop();
      let uriWithoutDB = uriParts.join('/')+ '/';
      connection = mysql.createConnection( uriWithoutDB );
    } else {
      dbName = cfg.database;
      connection = mysql.createConnection({
        host     : cfg.host || 'localhost',
        user     : cfg.username,
        password : cfg.password,
        port     : cfg.port || 3306
      });
    }

    connection.connect();

    connection.query(`CREATE DATABASE ${dbName};`, function(err) {
     if (err) {
        db.we.log.warn('Unknow error on try to create mysql DB: ', err);
        return cb(err);
      }

      connection.end();

      db.we.log.info(`Database "${dbName}" created`);

      cb(null, true);
    });
  },

  /**
   * Create the database in postgre database
   */
  createPostgreDatabase(callback) {

    const db = this,
        cfg = db.activeConnectionConfig,
        pg = require('pg');

    let dbName = cfg.database,
        username = cfg.username,
        password = cfg.password,
        host = cfg.host || 'localhost';

    let conStringPri = 'postgres://' + username + ':' + password + '@' + host + '/postgres';


    // connect to postgres db
    pg.connect(conStringPri, function afterConnectWithPG(err, client) {
      if (err) return callback(err);
      // create the db and ignore any errors, for example if it already exists.
      client.query('CREATE DATABASE ' + dbName, function afterCreateTheDB(err) {
        if (err) {
          db.we.log.warn('unknow error on try to create postgres DB:', err);
          return callback(err);
        }

        db.we.log.info(`Database "${dbName}" created`);

        callback(null, true);
        client.end(); // close the connection
      });
    });
  }
};

// -- private methods:

function parseModelAttributes (attrs, we) {
  if (!attrs) return {};

  let attr = {};

  for (let name in attrs) {
    attr[name] = clone(attrs[name]);
    attr[name].type = getModelTypeFromDefinition(attrs[name], we);
  }

  return attr;
}

function getModelTypeFromDefinition (attr, we) {
  if (attr.size) {
    if (isArray(attr.size)) {

      let fn = we.db.Sequelize[attr.type.toUpperCase()];
      fn.apply(null, attr.size);

      return fn(attr.size);
    } else {
      return we.db.Sequelize[attr.type.toUpperCase()](attr.size);
    }
  } else {
    return we.db.Sequelize[attr.type.toUpperCase()];
  }
}

module.exports = Database;