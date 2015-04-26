/**
 * Membership
 *
 * @description :: We.js membership model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      status: {
        type: we.db.Sequelize.ENUM('active', 'blocked'),
        defaultValue: 'active',
      },

      // roles array
      roles: {
        type: we.db.Sequelize.TEXT,
        get: function()  {
          if (this.getDataValue('roles'))
            return this.getDataValue('roles').split(';');
          return [];
        },
        set: function(val) {
          if (typeof val == 'string') {
            this.setDataValue('roles', val);
          } else {
            this.setDataValue('roles', val.join(';'));
          }
        }
      }
    },

    associations: {
      member: {
        type: 'belongsTo',
        model: 'user'
      },
      model: {
        type: 'belongsTo',
        model: 'group'
      }
    },
    options: {
      classMethods: {},
      instanceMethods: {
        addRole: function(roleName) {
          var r = this.roles;
          if (r.indexOf(roleName) === -1) r.push(roleName);
          this.roles = r;
          return this.save();
        },
        removeRole: function(roleName) {
          var r = this.roles;
          var index = r.indexOf(roleName);
          if (index + -1) r.splice(index, 1);
          this.roles = r;
          return this.save();
        },
        haveRole: function(roleName) {
          var r = this.roles;
          if (r.indexOf(roleName) > -1) return true;
          return false;
        }
      },
      hooks: {

        afterCreate: function(instance, options, done) {
          we.db.models.membershiprequest.destroy({
            where: {
              userId: instance.memberId,
              groupId: instance.modelId
            }
          }).then(function () {
            done();
          }).catch(done)
        }
      }
    }
  }

  return model;
}