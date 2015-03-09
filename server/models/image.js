/**
 * Images
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var mv = require('mv');
var uuid = require('node-uuid');
// image converter
var gm = require('gm');
var path = require('path');
var mime = require('mime');
var async = require('async');

module.exports = function ImageModel(db, hooks, events, sanitizer) {
  // we.js will be set in one event
  var we = null;

  // set sequelize model define and options
  var model = {
    definition: {
      // - user given data text
      // 
      label: {
        type: db.Sequelize.STRING
      },
      description: {
        type: db.Sequelize.TEXT
      },

      // - data get from file
      // 
      name: {
        type: db.Sequelize.STRING,
        allowNull: false,
        unique: true        
      },

      size: {
        type: db.Sequelize.INTEGER,
      },

      encoding: {
        type: db.Sequelize.STRING,
      },

      active: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: true        
      },

      originalname: {
        type: db.Sequelize.STRING
      },

      mime: {
        type: db.Sequelize.STRING
      },

      extension: {
        type: db.Sequelize.STRING
      },

      // creator: {
      //   model: 'user',
      //   required: true
      // },

      width: {
        type: db.Sequelize.STRING
      },

      height: {
        type: db.Sequelize.STRING
      }
    },

    options: {
      // table comment
      comment: "We.js we-core image table",

      classMethods: {
        getStyleUrlFromImage: function(image) {
          var host = we.config.hostname;

          return {
            original: host + '/api/v1/images/original/' + image.name,
            thumbnail: host + '/api/v1/images/thumbnail/' + image.name,
            mini: host + '/api/v1/images/mini/' + image.name,
            medium: host + '/api/v1/images/medium/' + image.name,
            large: host + '/api/v1/images/large/' + image.name
          };
        }
      },

      instanceMethods: {
        toJSON: function() {
          var obj = this.values;
          obj.urls = db.models.image.getStyleUrlFromImage(obj);
          // set default objectType
          obj.objectType = 'image';
          return obj;
        }
      },
      hooks: {
        beforeCreate: function(record, options, next) {
          // sanitize
          record = sanitizer.sanitizeAllAttr(record);
          next();
        },

        beforeUpdate: function(record, options, next) {
          // sanitize
          record = sanitizer.sanitizeAllAttr(record);
          next();
        }
      }
    }
  }

  hooks.on('we:models:set:joins', function (wejs, done) {
    we = wejs;

    done();
  });

  return model;
}