var path = require('path');
var _ = require('lodash');
var log = require('../log')();

/**
 * Helper function to load database configs
 * 
 * @param  {String}    projectFolder
 * @return {Object}    database config object
 */
module.exports = function loadDatabaseConfig(projectFolder) {
  var dbFileConfigs;
  // default config
  var dbConfigs = {
    prod: null,
    dev: {
      dialect:  'sqlite',
      storage: path.resolve( projectFolder, 'files/sqlite/dev.sqlite' ),
      // by default log to info
      logging: log.debug
    },
    test: {
      dialect:  'sqlite',
      storage: path.resolve( projectFolder, 'files/sqlite/test.sqlite' ),
      // by default log to info
      logging: log.debug
    }
  };

  // try to load database configs from project database config
  try {
    dbFileConfigs = require( path.resolve( projectFolder, 'config', 'local.js' )).database;
    _.merge(dbConfigs, dbFileConfigs);
  } catch(e) {

    if (e.code != 'MODULE_NOT_FOUND' ) {
      console.error('Unknow error on load database config:', e);  
    }

    // if config now found load sqlite temporary db
    var mkdirp = require('mkdirp');
    mkdirp( path.resolve( projectFolder, 'files', 'sqlite') , function (err) {
      if (err) throw new Error(err);
    });
  }

  return dbConfigs;
}  