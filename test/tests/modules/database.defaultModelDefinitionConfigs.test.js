var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we, dmdc, contextLoader, instanceMethods;

describe('database.defaultModelDefinitionConfigs', function () {

  before(function (done) {
    we = helpers.getWe();
    dmdc = we.db.defaultModelDefinitionConfigs;
    contextLoader = we.db.defaultClassMethods.contextLoader;
    instanceMethods = we.db.defaultInstanceMethods;
    done();
  });

  describe('define.classMethods', function() {

    it('classMethods.contextLoader should return done id dont have res.local.id', function (done) {
      var req = {
        userRoleNames: [],
        locals: {}
      };
      var res = {
        locals: { loadCurrentRecord: true }
      };

      var callback = function callback() {
        done();
      };

      contextLoader(req, res, callback);
    });

    it('classMethods.contextLoader should set owner if creatorId = req.user.id', function (done) {
      var creatorId = 2016;
      var recordId = 10;
      var req = {
        isAuthenticated: function() { return true; },
        user: { id: creatorId },
        userRoleNames: [],
        locals: {}
      };
      var res = {
        locals: {
          id: recordId, // record ID
          loadCurrentRecord: true
        },
      };

      var callback = function callback() {
        assert(req.userRoleNames.indexOf('owner') > -1);
        done();
      };

      contextLoader.bind({
        findOne: function(opts) {
          assert(opts.where.id, recordId);

          return new we.db.Sequelize.Promise(function(resolve){
            resolve({
              dataValues: {
                creatorId: creatorId
              },
              isOwner: function(id) {
                assert.equal(id, creatorId);
                return true;
              }
            });
          });
        }
      })(req, res, callback);
    });
  });

  describe('define.instanceMethods', function() {
    describe('isOwner', function() {
      it ('isOwner should return true if uid = this.creatorId', function () {
        assert(instanceMethods.isOwner.bind({
          creatorId: 2016
        })(2016));
      });
      it ('isOwner should return false if uid != this.creatorId', function () {
        assert(!instanceMethods.isOwner.bind({
          creatorId: 20
        })(2016));
      });
    });

    describe('getPath', function() {
      it ('getPath should throw error without req', function () {
        var error = null;
        try {
          instanceMethods.getPath();
        } catch(e) {
          error = e;
        }

        assert(error);
      });
      it ('getPath should get url from req.we.router.urlTo'
        // ,function () {
        //   var req = {
        //     we: we,
        //     paramsArray: []
        //   };

        //   var url  = instanceMethods.getPath.bind({
        //     id: 11,
        //     '$modelOptions': {
        //       name: {
        //         singular: 'user'
        //       }
        //     }
        //   })(req);

        //   assert(url);
        //   assert.equal(url, '/user/11');
        // }
      );
    });

    describe('getLink', function() {
      it ('getLink should throw error without req', function () {
        var error = null;
        try {
          instanceMethods.getLink();
        } catch(e) {
          error = e;
        }
        assert(error);
      });

      it ('getLink should return url with hostname', function () {
        var req = { we: we };

        var url  = instanceMethods.getLink.bind({
          getPath: function() {
            return '/path';
          }
        })(req);
        assert(url);
        assert.equal(url, we.config.hostname+'/path');
      });
    });
  });
});