/**
 * Url alias Model
 *
 * @module      :: Model
 */

module.exports = function UrlSlugModel(we) {
  return {
    definition: {
      alias: {
        type: we.db.Sequelize.STRING(760),
        allowNull: false,
        formFieldType: 'text',
        unique: true
      },
      target: {
        type: we.db.Sequelize.STRING(760),
        allowNull: false,
        formFieldType: 'text'
      },
      locale: {
        type: we.db.Sequelize.STRING,
        formFieldType: null
      }
    },

    options: {
      // Model tableName will be the same as the model name
      freezeTableName: true,

      hooks: {
        afterCreate: function(record, opts, done) {
          // cache after create a record
          we.router.alias.cache[record.target] = record;
          done();
        },
        afterUpdate: function(record, opts, done) {
          // cache after udate the record
          we.router.alias.cache[record.target] = record;
          done();
        },
        afterDestroy: function(record, opts, done) {
          delete we.router.alias.cache[record.target];
          done();
        }
      }
    }
  }
}