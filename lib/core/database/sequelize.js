/**
 * We.js sequelize integration
 */
var Sequelize = require('sequelize');
var async = require('async');
var path = require('path');

wejsSequelize = {
  /**
   * Connect in database
   * 
   * @param  {object} we 
   * @return {object} sequelize database connection
   */
  connect: function(we) {
    var dbC = wejsSequelize.databaseConfig(we);
    var configs = dbC[we.env];

    return new Sequelize( dbC.database, dbC.username, dbC.password, configs ); 
  },

  /**
   * Load we.js core models
   * 
   * @param {object} we 
   * @param {function} cb  the callback
   */
  loadCoreModels: function(we, cb) {
    // - sys_configuration model
    we.models.sys_configuration = we.db.define('sys_configuration', {
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

    async.series([
      function syncConfiguration(next) {
        we.models.sys_configuration
        .sync()
        .done(next);
      },
      // function syncPlugin(next) {
      //   we.models.sys_configuration.sync().then(next);
      // },      
    ],cb);

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
  }  
}

module.exports = wejsSequelize;