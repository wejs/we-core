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
      }
    },

    associations: {
      vocabulary: {
        type: 'belongsTo',
        model: 'vocabulary',
        inverse: 'terms'
      },
    },

    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {}
    }
  }
  return model;
}