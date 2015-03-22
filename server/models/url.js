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
      url: {
        type: we.db.Sequelize.STRING(1500),
        unique: true,
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

    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'urls'
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