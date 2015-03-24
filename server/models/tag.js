/**
 * TermModel
 *
 * @module      :: Model
 * @description :: [Add info about you model here]
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      text: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: we.db.Sequelize.TEXT
      },
      order: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: 0
      },
    },
    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'terms'
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