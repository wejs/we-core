/**
 * Role
 *
 * @module      :: Model
 * @description :: Role model
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      name : { type: we.db.Sequelize.STRING, allowNull: false, unique: true },
      description: { type: we.db.Sequelize.TEXT },
      // permissions array
      permissions: {
        type: we.db.Sequelize.TEXT,
        get: function()  {
          if (this.getDataValue('permissions'))
            return this.getDataValue('permissions').split(';');
          return [];
        },
        set: function(val) {
          if (typeof val == 'string') {
            this.setDataValue('permissions', val);
          } else {
            this.setDataValue('permissions', val.join(';'));
          }
        }
      },
      /**
       * System roles cant be deleted
       * @type {Object}
       */
      isSystemRole: {
        type: we.db.Sequelize.BOOLEAN,
        formFieldType: null,
        allowNull: true,
        defaultValue: false
      }
    },
    associations: {
      users:  {
        type: 'belongsToMany',
        model: 'user',
        inverse: 'roles',
        through: 'users_roles'
      }
    },
    options: {
      enableAlias: false,
      instanceMethods: {
        addPermission: function(permissionName) {
          var p = this.permissions;
          if (p.indexOf(permissionName) === -1)
            p.push(permissionName);

          this.permissions = p;
          return this.save();
        },
        removePermission: function(permissionName) {
          var p = this.permissions;
          var index = p.indexOf(permissionName);

          if (index + -1) p.splice(index, 1);

          this.permissions = p;
          return this.save();
        },

        havePermission: function(permissionName) {
          var p = this.permissions;
          if (p.indexOf(permissionName) > -1) return true;
          return false;
        }
      }
    }
  }
  return model;
}