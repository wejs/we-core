/**
 * Url alias Model
 *
 * @module      :: Model
 */

module.exports = function UrlSlugModel(we) {
  return {
    definition: {
      alias: {
        type: we.db.Sequelize.TEXT,
        allowNull: false,
        formFieldType: 'text'
      },
      target: {
        type: we.db.Sequelize.TEXT,
        allowNull: false,
        formFieldType: 'text'
      },
      locale: {
        type: we.db.Sequelize.STRING,
        formFieldType: null
      }
    }
  }
}