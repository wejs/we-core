module.exports = {
  requirements: function(we, done) {

    done();
  },
  /**
   * Install function run in we.js install.
   *
   * @param  {Object}   we    we.js object
   * @param  {Function} done  callback
   */
  install: function install(we, done) {
    we.utils.async.series([
      /**
       * Check and create default roles required for all we.js projects
       *
       * @param  {object} we
       * @param  {Function} cb callback
       */
      function registerDefaultRoles(done) {
        we.utils.async.parallel([
          function unAuthenticatedRole(done) {
            we.acl.registerOneDefaltRole(we, 'unAuthenticated', done);
          },
          function authenticatedRole(done) {
            we.acl.registerOneDefaltRole(we, 'authenticated', done);
          },
          function ownerRole(done) {
            we.acl.registerOneDefaltRole(we, 'owner', done);
          },
          function administratorRole(done) {
            we.acl.registerOneDefaltRole(we, 'administrator', done);
          }
        ], done);
      }
    ], done);
  },

  /**
   * Return a list of updates
   *
   * @param  {Object} we we.js object
   * @return {Array}    a list of update objects
   */
  updates: function updates() {
    return [{
      version: '0.3.69', // your plugin version
      update: function update0369(we, done) {
        var sql = 'ALTER TABLE `widgets` ADD '+
          ' COLUMN `inRecord` TINYINT(1) DEFAULT NULL;';
        we.db.defaultConnection.query(sql).then(function() {
          done();
        }).catch(done);
      }
    } , {
      version: '0.3.120', // your plugin version
      update: function update03120 (we, done) {

        we.utils.async.series([
          function changeWidgetTableThemeField(done) {
            var sql = 'ALTER TABLE `widgets` '+
              'CHANGE COLUMN `theme` `theme` VARCHAR(255) NULL ;';
            we.db.defaultConnection.query(sql).then(function() {
              done();
            }).catch(done);
          }
        ], done);
      }
    }
    ];
  }
};

// 'ALTER TABLE `roles` '+
// 'ADD COLUMN `isSystemRole` TINYINT(1) NULL DEFAULT 0 AFTER `updatedAt`;'
