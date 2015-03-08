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

module.exports = function ImageModel(db, hooks, events) {
  var model = {
    definition: {
      name: {
        type: db.Sequelize.STRING,
      },

      size: {
        type: db.Sequelize.INTEGER,
      },

      active: {
        type: db.Sequelize.BOOLEAN,
      },

      originalFilename: {
        type: db.Sequelize.STRING
      },

      mime: {
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
        // Upload the files
        upload: function(file, callback) {
          file.extension = file.filename.split('.').pop();

          // TODO add suport to files withouth extension
          if(!file.extension){
            sails.log.error('File extension not found', file);
            return callback('File extension not found', null);
          }

          file.newName =  uuid.v1() + '.' + file.extension;

          var newFilePath = path.resolve(sails.config.imageUploadPath + '/' + 'original' + '/' + file.newName);

          mv(file.path, newFilePath,{mkdirp: true}, function afterImageUpload(err) {
            if (err) {
              sails.log.error('Images.upload: Error on move file', err);
              return callback(err, null);
            }

            file.mime = mime.lookup(newFilePath);

            sails.log.verbose('arquivo movido para:',newFilePath);
            // get image size
            gm(newFilePath)
            .size(function (err, size) {
              if (err) {
                sails.log.error('Images.upload: Error on get image file size', err, newFilePath);
                return callback(err);
              }

              file.width = size.width;
              file.height = size.height;

              callback(null, file);
            });

          });
        },


        getStyleUrlFromImage: function(image) {
          var host = sails.config.hostname;

          return {
            original: host + '/api/v1/images/original/' + image.name,
            thumbnail: host + '/api/v1/images/thumbnail/' + image.name,
            mini: host + '/api/v1/images/mini/' + image.name,
            medium: host + '/api/v1/images/medium/' + image.name,
            large: host + '/api/v1/images/large/' + image.name
          };
        },

        uploadMultiple: function(files, creatorId, callback){
          var uploadedFiles = [];
          var fileUp;

          async.each(files, function(file, next){
            file.path =  file.fd;

            Images.upload(file, function(err){
              if (err) {
                next(err);
              } else {
                fileUp = file;
                fileUp.name = file.newName;
                fileUp.originalFilename = file.originalFilename;
                fileUp.size = file.size;
                fileUp.extension = file.extension;
                fileUp.creator = creatorId;
                uploadedFiles.push(fileUp);
                next();
              }
            });
          },function (err) {
            if (err) {
              callback(err, null);
            }else{
              callback(null, uploadedFiles);
            }
          });
        }
      },

      instanceMethods: {
        toJSON: function() {
          var obj = this.toObject();
          obj.urls = Images.getStyleUrlFromImage(obj);
          // set default objectType
          obj.objectType = 'image';
          return obj;
        }
      },
      hooks: {
        beforeCreate: function(record, options, next) {
          // sanitize
          record = SanitizeHtmlService.sanitizeAllAttr(record);
          next();
        },

        beforeUpdate: function(record, options, next) {
          // sanitize
          record = SanitizeHtmlService.sanitizeAllAttr(record);
          next();
        }
      }
    }
  }

  hooks.on('we:models:set:joins', function (we, done) {

    done();
  });

  return model;
}