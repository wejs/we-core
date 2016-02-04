var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we, syncAllModels;

describe('database.syncAllModels', function () {

  before(function (done) {
    we = helpers.getWe();
    syncAllModels = we.db.syncAllModels;
    done();
  });

  it('database.syncAllModels should run db.defaultConnection.sync', function (done) {
    syncAllModels.bind({
      defaultConnection: {
        sync: function() {
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }
      }
    })(done);
  });

  it('database.syncAllModels should run db.defaultConnection.sync with'+
     'forced reset if cd.resetAllData is set', function (done) {
    syncAllModels.bind({
      defaultConnection: {
        sync: function(opts) {
          assert.equal(opts.force, true);
          return new we.db.Sequelize.Promise(function (resolve) {
            resolve();
          });
        }
      }
    })({ resetAllData: true }, done);
  });
});