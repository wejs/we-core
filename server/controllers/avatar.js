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

  /**
   * Get user avatar with user id
   *
   */
  getAvatar: function getAvatar(req, res) {
    var we = req.getWe();

    var id = req.params.id;
    var style = req.params.style;

    if (style === 'responsive') {
      style = 'large';
    } else if (!style) {
      style = 'thumbnail';
    }

    var defaultAvatarPath = we.config.defaultUserAvatar;

    if(!id) return res.forbidden();

    we.db.models.find(id).done(function (err, user) {
      if (err) return res.serverError(err);

      if (user && user.avatar) {
        we.db.models.image.find(user.avatar).done(function (err, image) {
          if (err) return res.serverError(err);

          FileImageService.getFileOrResize(image.name,style ,function(err, contents){
            if(err){
              we.log.debug('Error on get avatar: ', err);
              return res.notFound();
            }

            if(image.mime){
              res.contentType(image.mime);
            }else{
              res.contentType('image/png');
            }

            res.send(contents);
          });

        });
      } else {
        fs.readFile(defaultAvatarPath,function (err, contents) {
          if (err) return res.serverError(err);

          res.contentType('image/png');
          res.send(contents);
        });
      }
    });

  },

  // changeAvatar: function (req, res) {
  //   // TODO validate req.files.files
  //   var imageId = req.param('image');

  //   if(!req.isAuthenticated()){
  //     return res.forbidden();
  //   }

  //   Images.findOneById(imageId)
  //   .exec(function(err, image){
  //     if (err) return res.negotiate(err);

  //     if(!image || req.user.id !== image.creator){
  //       sails.log.debug('User:avatarChange:User dont are image woner or image not found',req.user, image);
  //       return res.forbidden();
  //     }

  //     // set current user vars
  //     req.user.avatar = image.id;

  //     // update db user
  //     User.update(
  //       {id: req.user.id},
  //       {avatar: image.id}
  //     ).exec(function afterwards(err){
  //       if (err) return res.negotiate(err);
  //       res.send({
  //         'user': req.user,
  //         'avatar': image
  //       });
  //     });
  //   });
  // }

};