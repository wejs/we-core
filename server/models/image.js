/**
 * Images
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var  fs = require('fs');
var gm = require('gm');
var async = require('async');
var mkdirp = require('mkdirp');


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
        type: 'belongsTo',
        model: 'user',
        inverse: 'images'
      },
      avatarOf: {
        emberOnly: true,
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
            original: we.config.hostname + '/api/v1/image/original/' + image.name,
            thumbnail: we.config.hostname + '/api/v1/image/thumbnail/' + image.name,
            mini: we.config.hostname + '/api/v1/image/mini/' + image.name,
            medium: we.config.hostname + '/api/v1/image/medium/' + image.name,
            large: we.config.hostname + '/api/v1/image/large/' + image.name
          };
        },

        /**
         * Get image styles
         *
         * @return {object} avaible image styles
         */
        getImageStyles: function getImageStyles() {
          return we.config.upload.image.avaibleStyles;
        },

        getImagePath: function getImagePath(imageStyle, fileName) {
          if (!imageStyle) imageStyle = 'original';
          return we.config.upload.image.uploadPath + '/'+ imageStyle +'/' + fileName;
        },

        getFileOrResize: function getFileOrResize(fileName, imageStyle, callback) {
          var path = we.db.models.image.getImagePath(imageStyle, fileName);

          fs.readFile(path, function (err, contents) {
            if (err) {
              if (err.code != 'ENOENT' || imageStyle == 'original' ) {
                return callback(err);
              }

              var originalFile =  we.db.models.image.getImagePath('original', fileName);

              var width = we.config.upload.image.styles[imageStyle].width;
              var heigth = we.config.upload.image.styles[imageStyle].heigth;

              // resize and remove EXIF profile data
              gm(originalFile)
              .resize(width, heigth)
              .noProfile()
              .write(path, function (err) {
                if (err) return callback(err);
                fs.readFile(path, function (err, contents) {
                  callback(null, contents);
                });
              });

            } else {
              callback(null, contents);
            }
          });
        },

        /**
         * Resize one image in server and retur size
         *
         * @param  {strinh}   originalFile
         * @param  {object}   cords
         * @param  {Function} cb           callback
         */
        resizeImageAndReturnSize: function(originalFile, cords, cb) {
          gm(originalFile).crop(cords.width, cords.height, cords.x, cords.y)
          .write(originalFile, function (err) {
            if (err) {
              we.log.error('Error on crop file:', originalFile, cords, err);
              return cb(err);
            }
            // get image size
            gm(originalFile).size(function (err, size) {
              if (err) return cb(err);
              return cb(null,size);
            });
          });
        },

        /**
         * Delete old image styles for one image
         * @param  {string}   imageName
         * @param  {Function} callback
         */
        deleteImageStylesWithImageName: function(imageName, callback){
          var imageStyles = we.db.models.image.getImageStyles();
          async.each(imageStyles,function(style, next){
            var path = we.db.models.image.getImagePath(style, imageName);
            fs.exists(path, function(exists) {
              we.log.verbose(path, exists);
              if (exists) {
                fs.unlink(path, function (err) {
                  if (err) throw err;
                  next();
                });
              } else {
                next();
              }
            });
          },callback);
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

  we.hooks.on('we:create:default:folders', function(we, done) {
    // create image upload path
    mkdirp(we.config.upload.image.uploadPath, function(err) {
      if (err) we.log.error('Error on create image upload path', err);

      var imageStyles = we.db.models.image.getImageStyles();

      async.each(imageStyles, function (style, next) {
        fs.lstat(we.config.upload.image.uploadPath + '/' + style, function(err, stats) {
          if (!err && stats.isDirectory()) {
            mkdirp(we.config.upload.image.uploadPath + '/' + style, function (err) {
              if (err) we.log.error('Error on create upload path', err);
              next();
            })
          } else {
            next();
          }
        });
      }, done);
    })
  });

  return model;
}