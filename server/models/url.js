/**
 * Url Model
 *
 * @module      :: Model
 * @description :: Role model
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      creatorId: { type: we.db.Sequelize.BIGINT },

      url: {
        type: we.db.Sequelize.STRING(1500),
        allowNull: false,
      },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
      },

      modelId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },

      hostName: {
        type: we.db.Sequelize.STRING
      }
    },

    options: {
      paranoid: false,

      classMethods: {},
      instanceMethods: {},
      hooks: {}
    }
  }

  return model;
}