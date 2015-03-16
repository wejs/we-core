/**
 * Images
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = function ImageModel(we) {

  // set sequelize model define and options
  var model = {
    definition: {
      // - user given data text
      //
      label: {
        type: we.db.Sequelize.STRING
      },
      description: {
        type: we.db.Sequelize.TEXT
      },

      // - data get from file
      //
      name: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      size: {
        type: we.db.Sequelize.INTEGER,
      },

      encoding: {
        type: we.db.Sequelize.STRING,
      },

      active: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      },

      originalname: {
        type: we.db.Sequelize.STRING
      },

      mime: {
        type: we.db.Sequelize.STRING
      },

      extension: {
        type: we.db.Sequelize.STRING
      },

      width: {
        type: we.db.Sequelize.STRING
      },

      height: {
        type: we.db.Sequelize.STRING
      }
    },

    associations: {
      creator:  {
        type: 'hasOne',
        model: 'user',
        inverse: 'images',
        foreignKey : 'creatorId'
      },
      avatarOf: {
        type: 'hasOne',
        model: 'user',
        inverse: 'avatar',
        foreignKey : 'avatarId'
      }
    },

    options: {
      // table comment
      comment: 'We.js we-core image table',

      classMethods: {
        getStyleUrlFromImage: function(image) {
          return {
            original: we.config.hostname + '/api/v1/images/original/' + image.name,
            thumbnail: we.config.hostname + '/api/v1/images/thumbnail/' + image.name,
            mini: we.config.hostname + '/api/v1/images/mini/' + image.name,
            medium: we.config.hostname + '/api/v1/images/medium/' + image.name,
            large: we.config.hostname + '/api/v1/images/large/' + image.name
          };
        }
      },

      instanceMethods: {
        toJSON: function() {
          var obj = this.get();
          obj.urls = we.db.models.image.getStyleUrlFromImage(obj);
          return obj;
        }
      },
      hooks: {
        beforeCreate: function(record, options, next) {
          // sanitize
          record = we.sanitizer.sanitizeAllAttr(record);
          next();
        },

        beforeUpdate: function(record, options, next) {
          // sanitize
          record = we.sanitizer.sanitizeAllAttr(record);
          next();
        }
      }
    }
  }

  return model;
}