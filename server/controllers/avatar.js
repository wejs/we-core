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

    we.db.models.user.find(id).then(function (user) {
      if (user && user.avatarId) {
        we.db.models.image.find(user.avatarId).then(function (image) {
          if (!image) return res.notFound();

          we.db.models.image.getFileOrResize(image.name, style, function (err, contents) {
            if(err) {
              we.log.error('Error on get avatar: ', err);
              return res.serverError();
            }

            if (!contents) return res.notFound();

            if (image.mime) {
              res.contentType(image.mime);
            } else {
              res.contentType('image/png');
            }

            res.send(contents);
          });

        })
      } else {
        fs.readFile(defaultAvatarPath, function (err, contents) {
          if (err) return res.serverError(err);

          res.contentType('image/png');
          res.send(contents);
        });
      }
    }).catch(res.serverError);
  },

  changeAvatar: function changeAvatar(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();
    if (!res.locals.record) return res.notFound();

    var we = req.getWe();

    var imageId = req.body.image;

    we.db.models.image.find({
      where: { id: imageId }
    }).then(function (image) {
      we.log.warn(image.get(), req.user.id)

      if (!image || req.user.id !== image.creatorId) {
        we.log.debug('User:avatarChange:User dont are image woner or image not found',req.user, image);
        return res.forbidden();
      }

      // set current user vars
      req.user.avatar = image.id;

      // update db user
      res.locals.record.setAvatar(image).then(function() {
        res.send({
          'user': req.user
        });
      });

    }).catch(res.serverError);
  }

};