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
  }

};