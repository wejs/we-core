/**
 * Membership
 *
 * @description :: We.js membership model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      id: { type: we.db.Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      // mebership model name
      memberName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      memberId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      modelId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },

      status: {
        type: we.db.Sequelize.ENUM('active', 'blocked', 'invited', 'requested'),
        defaultValue: 'active',
      },
    },

    associations: {
      roles: {
        type: 'belongsToMany',
        model: 'membershiprole',
        inverse: 'memberships',
        through: 'membership_membershiprole',
        foreignKey: 'id'
      }
    }
  }

  return model;
}