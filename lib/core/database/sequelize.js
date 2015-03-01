/**
 * We.js sequelize integration
 */
var Sequelize = require('sequelize');
var async = require('async');

module.exports = {
  /**
   * Connect in database
   * 
   * @param  {object} we 
   * @return {object} sequelize database connection
   */
  connect: function(we) {
    var dbC = we.loaders.databaseConfig(we);
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

  }
}