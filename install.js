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
  updates: function updates(we) {
    return [
      // {
      //   version: '',
      //   update: function(we, done) {

      //   }
      // }
    ];
  }
};