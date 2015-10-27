var path = require('path');
var _ = require('lodash');
var log = require('../log')();

var dbConfigs = null;

/**
 * Helper function to load database configs
 *
 * @param  {String}    projectFolder
 * @return {Object}    database config object
 */
module.exports = function loadDatabaseConfig(projectFolder) {
  if (dbConfigs) return dbConfigs;

  var dbFileConfigs;
  // default config
  dbConfigs = {
    prod: {
      dialect: 'mysql',
      database: 'test',
      username: 'root',
      password: '',
      // by default log to info
      logging: log.debug
    },
    dev: {
      dialect: 'mysql',
      database: 'test',
      username: 'root',
      password: '',
        // by default log to info
      logging: log.debug
    },
    test: {
      dialect: 'mysql',
      database: 'test',
      username: 'root',
      password: '',
      // by default log to info
      logging: log.debug
    }
  };

  // try to load database configs from project database config
  try {
    dbFileConfigs = require( path.resolve( projectFolder, 'config', 'local.js' )).database;
    _.merge(dbConfigs, dbFileConfigs);
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load database config:', e);
    }
  }

  return dbConfigs;
}