/**
 * Url alias Model
 *
 * @module      :: Model
 */

module.exports = function UrlSlugModel(we) {
  return {
    definition: {
      // url to
      alias: {
        type: we.db.Sequelize.TEXT,
        allowNull: false,
        formFieldType: 'text',
        isURL: true,
        uniqueAliasName: function (val, cb) {
          if(!val) return cb();
          return we.db.models.urlAlias.findOne({
            where: { alias: val }, attributes: ['id']
          }).then(function (r) {
            if (r) return cb('urlAlias.alias.not-unique');
            cb();
          }).catch(cb);
        }
      },
      // url from
      target: {
        type: we.db.Sequelize.TEXT,
        allowNull: false,
        formFieldType: 'text',
        isURL: true,
        uniqueTargetName: function (val, cb) {
          if(!val) return cb();
          return we.db.models.urlAlias.findOne({
            where: { target: val }, attributes: ['id']
          }).then(function (r) {
            if (r) return cb('urlAlias.target.not-unique');
            cb();
          }).catch(cb);
        }
      },
      locale: {
        type: we.db.Sequelize.STRING,
        formFieldType: null
      }
    },

    options: {
      // Model tableName will be the same as the model name
      freezeTableName: true,
      enableAlias: false
    }
  }
}