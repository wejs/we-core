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
      description: { type: we.db.Sequelize.TEXT }
    },

    associations: {
      permissions:  {
        type: 'belongsToMany',
        model: 'permission',
        inverse: 'roles',
        through: 'roles_permissions'
      },

      users:  {
        type: 'belongsToMany',
        model: 'user',
        inverse: 'roles',
        through: 'users_roles'
      }
    },

    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {}
    }
  }

  return model;
}