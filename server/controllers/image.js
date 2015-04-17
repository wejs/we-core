/**
 * ImagesController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */
var gm = require('gm');
var _ = require('lodash');

module.exports = {

  findOne : function (req, res) {
    var we = req.getWe();

    var fileName = req.params.name;

    if (!fileName) {
      return res.badRequest('image:findOne: fileName is required');
    }

    var avaibleImageStyles = we.config.upload.image.avaibleStyles;

    var imageStyle = req.param.style;
    if (!imageStyle) {
      imageStyle = 'original';
    } else if(
      imageStyle !== 'original' &&
      avaibleImageStyles.indexOf(imageStyle) === -1)
    {
      return res.badRequest('Image style invalid');
    }

    we.db.models.image.find({ where: {name: fileName} })
    .done(function(err, image) {
      if (err) {
        we.log.error('Error on find image by name:', fileName, err);
        return res.serverError(err);
      }

      // image not found
      if (!image) {
        we.log.silly('image:findOne: image not found:', fileName);
        return res.notFound();
      }

      we.log.silly('image:findOne: image found:', image);

      we.db.models.image.getFileOrResize(fileName, imageStyle, function(err, contents) {
        if (err) {
          we.log.error('Error on getFileOrResize:', fileName, err);
          return res.serverError(err);
        }

        if (!contents) return res.notFound();

        if (image.mime) {
          res.contentType(image.mime);
        } else {
          res.contentType('image/png');
        }
        return res.send(contents);
      })
    });
  },

  /**
   * Find image by id and returm image model data
   */
  findOneReturnData : function (req, res) {
    var we = req.getWe();

    var fileId = req.params.id;
    if (!fileId) {
      return res.send(404);
    }
    we.db.models.image.find({
     where: {id: fileId}
    }).then(function (image) {
      if(!image){
        return res.send(404);
      }
      res.send({
        image: image
      });
    }).catch(function(err){
      we.log.error('Error on get image from BD: ',err, fileId);
      return res.send(404);
    });
  },

  /**
   * Upload file to upload dir and save metadata on database
   */
  create: function createOneImage(req, res) {
    // if (!req.isAuthenticated()) return res.forbidden('Logged in user not found');
    var we = req.getWe();

    // images in upload
    var files = req.files;

    if (!files.image) return res.badRequest('File image not found');
    if (!_.isObject(files.image)) return res.badRequest('File value is invalid');

    we.log.debug('image:create: files.image to save:', files.image);

    // get image size
    gm(files.image.path).size(function (err, size) {
      if (err) {
        we.log.error('image.create: Error on get image file size:', err, files.image);
        return res.serverError(err);
      }

      files.image.width = size.width;
      files.image.height = size.height;
      files.image.mime = files.image.mimetype;

      if (req.isAuthenticated()) files.image.creatorId = req.user.id;


      res.locals.Model.create(files.image)
      .done(function(err, record) {
        if (err) {
          we.log.error('Error on create image record:', err);
          return res.serverError(err);
        }

        if (record) we.log.debug('New image record created:', record.get());

        return res.created(record);
      });
    });
  },

  // /**
  //  * Crop one file by file id
  //  */
  cropImage : function (req, res) {
    var we = req.getWe();

    var fileId = req.params.id;
    var cords = {};
    cords.width = req.body.w;
    cords.height = req.body.h;
    cords.x = req.body.x;
    cords.y = req.body.y;

    if(!fileId ) { return res.send(400,'File id param is required'); }

    if(!cords.width || !cords.height || cords.x === null || cords.y === null){
      return res.send(400,'Width, height, x and y params is required');
    }

    if(!req.user || !req.user.id) {
      we.log.warn('errr no user')
      return res.send(404);
    }

    var user_id = req.user.id;

    we.db.models.image.find({
      where: {id: fileId}
    }).done(function(err, image) {
      if (err) {
        we.log.error('Error on get image from BD: ',err, fileId);
        return res.send(404);
      }
      if(!image || user_id !== image.creator){
        we.log.error('Image crop forbiden');
        return res.send(404);
      }

      var originalFile = FileImageService.getImagePath(image.name, 'original');


      we.log.verbose('Filename:', image.name);

      FileImageService.resizeImageAndReturnSize(originalFile, cords, function(err, size){

        image.width = size.width;
        image.height = size.height;
        // save the new width and height on db
        image.save();

        we.log.verbose('resize image to:', cords);

        we.log.verbose('result:',size.width, size.width);

        // delete old auto generated image styles
        FileImageService.deleteImageStylesWithImageName(image.name, function(err){
          if (err){
            we.log.error('Error on delete old image styles:',image, err);
            return res.send(500);
          }
          res.send({
            image: image
          });
        });
      });
    });
  }
};