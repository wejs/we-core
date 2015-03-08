/**
 * ImagesController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {

  // findOne : function (req, res, next) {
  //   var sails = req._sails;

  //   var fileName = req.param('name');
  //   if(!fileName) {
  //     return next();
  //   }

  //   var Images = sails.models.images;

  //   var avaibleImageStyles = sails.config.upload.image.avaibleStyles;

  //   var imageStyle = req.param('style');
  //   if(!imageStyle){
  //     imageStyle = 'original';
  //   }else if(
  //     imageStyle !== 'original' &&
  //     avaibleImageStyles.indexOf(imageStyle) === -1)
  //   {
  //     return res.badRequest('Image style invalid');
  //   }

  //   Images.findOne()
  //   .where({name: fileName})
  //   .exec(function(err, image) {
  //     if (err) { return res.negotiate(err); }

  //     if (!image) {
  //       return res.notFound(image);
  //     }

  //     FileImageService.getFileOrResize(image.name, imageStyle ,function(err, contents){
  //       if(err){
  //         sails.log.error('Image:findOne:Error on get image:',err);
  //         return res.send(500);
  //       }

  //       if(!contents){
  //         return res.send(404);
  //       }

  //       if(image.mime){
  //         res.contentType(image.mime);
  //       }else{
  //         res.contentType('image/png');
  //       }

  //       return res.send(contents);
  //     });
  //   });
  // },

  /**
   * Find image by id and returm image model data
   */
  findOneReturnData : function (req, res){
    var fileId = req.param('id');
    if(!fileId){
      return res.send(404);
    }
    Images.findOne()
    .where({id: fileId})
    .exec(function(err, image) {
      if (err) {
        sails.log.error('Error on get image from BD: ',err, fileId);
        return res.send(404);
      }
      if(!image){
        return res.send(404);
      }
      res.send({
        images: image
      });
    });
  },


  // /**
  //  * Upload file to upload dir and save metadata on database
  //  */
  // create: function createMultiplesRecords(req, res) {
  //   if (!req.isAuthenticated()) {
  //     return res.forbidden('Logged in user not found');
  //   }

  //   var sails = req._sails;
  //   var Images = sails.models.images;

  //   var creatorId = req.user.id;

  //   req.file('images').upload({
  //     maxBytes: 20000000
  //   },function (err, files) {
  //     if (err) {
  //       sails.log.error('Error on receive uploaded images', err);
  //       return res.serverError(err);
  //     }
  //     Images.uploadMultiple(files, creatorId, function(err, uploadedFiles) {
  //       if (err) {
  //         sails.log.error('Error on upload multiple images', err);
  //         res.send(
  //           {
  //             'files':[],
  //             'error': err
  //           }
  //         );
  //       } else {
  //         Images.create(uploadedFiles).exec(function(error, salvedFiles) {
  //           if (err) {
  //             sails.log.error('Error on create image', err);
  //             return res.serverError(err);
  //           }

  //           sails.log.verbose('> salvedFiles',salvedFiles);
  //           res.send({
  //             images: salvedFiles
  //           });

  //         });
  //       }
  //     });
  //   });
  // },

  // /**
  //  * Crop one file by file id
  //  */
  // cropImage : function (req, res) {

  //   var sails = req._sails;
  //   var Images = sails.models.images;

  //   var fileId = req.param('id');
  //   var cords = {};
  //   cords.width = req.param('w');
  //   cords.height = req.param('h');
  //   cords.x = req.param('x');
  //   cords.y = req.param('y');

  //   if(!fileId ) { return res.send(400,'File id param is required'); }

  //   if(!cords.width || !cords.height || cords.x === null || cords.y === null){
  //     return res.send(400,'Width, height, x and y params is required');
  //   }

  //   if(!req.user || !req.user.id) {
  //     sails.log.warn('errr no user')
  //     return res.send(404);
  //   }

  //   var user_id = req.user.id;

  //   Images.findOne()
  //   .where({id: fileId})
  //   .exec(function(err, image) {
  //     if (err) {
  //       sails.log.error('Error on get image from BD: ',err, fileId);
  //       return res.send(404);
  //     }
  //     if(!image || user_id !== image.creator){
  //       sails.log.error('Image crop forbiden');
  //       return res.send(404);
  //     }

  //     var originalFile = FileImageService.getImagePath(image.name, 'original');


  //     sails.log.verbose('Filename:', image.name);

  //     FileImageService.resizeImageAndReturnSize(originalFile, cords, function(err, size){

  //       image.width = size.width;
  //       image.height = size.height;
  //       // save the new width and height on db
  //       image.save();

  //       sails.log.verbose('resize image to:', cords);

  //       sails.log.verbose('result:',size.width, size.width);

  //       // delete old auto generated image styles
  //       FileImageService.deleteImageStylesWithImageName(image.name, function(err){
  //         if (err){
  //           sails.log.error('Error on delete old image styles:',image, err);
  //           return res.send(500);
  //         }
  //         res.send({
  //           image: image
  //         });
  //       });
  //     });
  //   });
  // }
};
