/**
 * VocabularyModel
 *
 * @module      :: Model
 * @description :: [Add info about you model here]
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      name: {
        type: we.db.Sequelize.STRING
      },

      description: {
        type: we.db.Sequelize.TEXT
      }
    },

    associations: {
      // terms: {
      //   type: 'belongsToMany',
      //   model: 'term',
      //   inverse: 'vocabulary',
      //   through: 'term_vocabulary'
      // },

      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'vocabularies'
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
