/**
 * AvatarController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */
var fs = require('fs');

module.exports = {
  _config: {
    rest: false
  },

  userAvatarsPage: function userAvatarsPage(req, res) {

    if(!req.isAuthenticated()) return res.redirect('/login');

    res.locals.user = req.user;

    Images.findOne({
      id: req.user.avatar
    })
    .exec(function(err, image){
      if (err) return res.negotiate(err);

      res.locals.currentAvatar = image;

      res.view();
    });

  },

  getAvatar: function getAvatar(req, res) {
    var id = req.param('id');
    var style = req.param('style');
    if(style === 'responsive'){
      style = 'large';
    }else if(!style){
      style = 'thumbnail';
    }

    var defaultAvatarPath = sails.config.defaultUserAvatar;

    if(!id) return res.forbidden();

    User.findOneById(id).exec(function(err, user){
      if (err) return res.negotiate(err);

      if(user && user.avatar){
        Images.findOneById(user.avatar).exec(function(err, image) {
          if (err) return res.negotiate(err);

          FileImageService.getFileOrResize(image.name,style ,function(err, contents){
            if(err){
              sails.log.debug('Error on get avatar',err);
              return res.send(404);
            }

            if(image.mime){
              res.contentType(image.mime);
            }else{
              res.contentType('image/png');
            }

            res.send(contents);
          });

        });
      }else{
        fs.readFile(defaultAvatarPath,function (err, contents) {
          if(err){
            sails.log.error('Error on get avatar',err);
            return res.send(404);
          }

          res.contentType('image/png');
          res.send(contents);
        });
      }
    });

  },

  changeAvatarPage: function changeAvatarPage(req, res, next) {

    if(!req.isAuthenticated()) return next();

    res.locals.user = req.user;

    res.view();
  },

  uploadAvatar: function uploadUserAvatar(req, res){
    if(!req.isAuthenticated()){
      return res.forbidden('Logged in user not found');
    }

    req.file('avatar').upload(function (err, files) {
      if (err){ return res.serverError(err); }

      if(!files){
        req.flash('warning-message',res.i18n('avatar.upload.noFile'));
        return res.redirect('/avatar');
      }

      var file = files[0];
      file.path =  file.fd;

      Images.upload(file, function(err){
        if(err){
          sails.log.error('Error on upload avatar to server', err, file);
          res.serverError(err);
        } else {

          var fileUp;
          fileUp = file;
          fileUp.name = file.newName;
          fileUp.originalFilename = file.originalFilename;
          fileUp.size = file.size;
          fileUp.extension = file.extension;
          fileUp.creator = req.user.id;

          Images.create(fileUp).exec(function(error, salvedFile) {
            if (err) { return res.serverError(err); }

            sails.log.verbose('> new avatar',salvedFile);

            User.findOne({id: req.user.id})
            .exec(function(err, user){
              if (err) return res.negotiate(err);

              user.avatar = salvedFile.id;

              user.save(function(err){
                if (err) return res.negotiate(err);

                req.flash('success-message',res.i18n('avatar.upload.sucessfull'));
                res.redirect('/avatar');

              });

            });

          });
        }
      });
    });
  },

  /**
   * Crop one file by file id
   */
  cropAvatarPage : function cropAvatar(req, res){

    if(!req.isAuthenticated()) return next();

    res.locals.user = req.user;

    res.view();

  },


  /**
   * Crop one file by file id
   */
  cropAvatar : function cropAvatar(req, res){

    if(!req.isAuthenticated()) return res.forbidden();

    var fileId = req.param('imageId');
    var cords = {};
    cords.width = req.param('coord-w');
    cords.height = req.param('coord-h');
    cords.x = req.param('coord-x');
    cords.y = req.param('coord-y');

    if(!fileId ) return res.badRequest('File id param is required');

    if(!cords.width || !cords.height || cords.x === null || cords.y === null){
      return res.badRequest('Width, height, x and y params is required');
    }

    if(req.user.avatar !== fileId){
      return res.forbidden();
    }

    var userId = req.user.id;

    Images.findOne()
    .where({id: fileId})
    .exec(function(err, image) {
      if (err) {
        sails.log.error('Error on get image from BD: ',err, fileId);
        return res.notFound();
      }
      if(!image || userId !== image.creator){
        sails.log.error('Image crop forbiden');
        return res.notFound();
      }

      var originalFile = FileImageService.getImagePath(image.name, 'original');

      sails.log.debug('Filename:', image.name);

      FileImageService.resizeImageAndReturnSize(originalFile, cords, function(err, size){

        image.width = size.width;
        image.height = size.height;
        // save the new width and height on db
        image.save();

        sails.log.verbose('resize image to:', cords);

        sails.log.verbose('result:',size.width, size.width);

        // delete old auto generated image styles
        FileImageService.deleteImageStylesWithImageName(image.name, function(err){
          if (err){
            sails.log.error('Error on delete old image styles:',image, err);
            return res.serverError(500);
          }

          req.flash('success-message',res.i18n('avatar.crop.sucessfull'));
          res.redirect('/avatar');
        });
      });
    });
  },

  changeAvatar: function (req, res) {
    // TODO validate req.files.files
    var imageId = req.param('image');

    if(!req.isAuthenticated()){
      return res.forbidden();
    }

    Images.findOneById(imageId)
    .exec(function(err, image){
      if (err) return res.negotiate(err);

      if(!image || req.user.id !== image.creator){
        sails.log.debug('User:avatarChange:User dont are image woner or image not found',req.user, image);
        return res.forbidden();
      }

      // set current user vars
      req.user.avatar = image.id;

      // update db user
      User.update(
        {id: req.user.id},
        {avatar: image.id}
      ).exec(function afterwards(err){
        if (err) return res.negotiate(err);
        res.send({
          'user': req.user,
          'avatar': image
        });
      });
    });
  },

  /**
   * Upload user avatar file to upload dir and save metadata on database
   * API
   *
   * @TODO delete old avatars
   * @TODO only allow upload one avatar
   */
  uploadAvatarAPI : function uploadOneUserAvatar(req, res){
    if(!req.isAuthenticated()){
      return res.forbidden('Logged in user not found');
    }

    var creatorId = req.user.id;

    req.file('images').upload(function (err, files) {
      if (err){ return res.serverError(err); }
      Images.uploadMultiple(files, creatorId, function(err, uploadedFiles){
        if(err){
          res.send(
            {
              'files':[],
              'error': err
            }
          );
        } else {
          Images.create(uploadedFiles).exec(function(error, salvedFiles) {
            if (err) { return res.serverError(err); }

            sails.log.verbose('> salvedFiles',salvedFiles);
            res.send({
              images: salvedFiles
            });

          });
        }
      });
    });
  },

};