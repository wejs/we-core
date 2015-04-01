/**
 * ModelsTagsModel
 *
 * @module      :: Model
 * @description :: Association table to models and tags
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      modelId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },
      field: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      isTag: {
        type: we.db.Sequelize.STRING
      },
      order: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: 0
      },
    },

    associations: {
      term: {
        type: 'belongsTo',
        model: 'term',
        inverse: 'models'
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