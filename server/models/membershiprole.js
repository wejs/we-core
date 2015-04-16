/**
 * Membership Role
 *
 * @module      :: Model
 * @description :: Membership Role model
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      name : { type: we.db.Sequelize.STRING, allowNull: false },
      description: { type: we.db.Sequelize.TEXT },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      modelId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      }
    },

    associations: {
      membershippermissions: {
        type: 'belongsToMany',
        model: 'membershippermission',
        inverse: 'membershiproles',
        through: 'membershiproles_membershippermissions'
      },

      memberships: {
        type: 'belongsToMany',
        model: 'membership',
        inverse: 'membershiproles',
        through: 'membership_membershiprole'
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