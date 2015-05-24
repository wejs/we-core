/**
 * FollowController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  _config: {
    rest: false
  },

  /**
   * get Follow status for one model
   */
  isFollowing: function isFollowing(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();

    var query = {};

    var userId = req.user.id;

    if (!req.params.model) {
      we.log.warn('Model name not found', req.params.model, req.params.modelId);
      return res.badRequest();
    }

    query.model = req.params.model;
    if (req.params.modelId) query.modelId = req.params.modelId;
    if (userId) query.userId = userId;

    we.db.models.follow.findAll({
      where: query
    }).then( function (records) {
      res.send({
        follow: records
      });
    });
  },

  /**
   * Follow something
   */
  follow: function createFollow(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();

    if (!req.params.model || !req.params.modelId) {
      we.log.warn('Model name or modelId not found', req.params.model, req.params.modelId);
      return res.badRequest();
    }

    // check if record exists
    we.db.models.follow.follow(req.params.model, req.params.modelId, req.user.id, function (err, follow) {
      if (err) return res.serverError(err);
      if (!follow) return res.forbidden();

      // // send the change to others user connected devices
      // var socketRoomName = 'user_' + userId;
      // sails.io.sockets.in(socketRoomName).emit(
      //   'follow:follow', salvedFollow
      // );

      return res.send({follow: follow})
    });
  },

  unFollow: function deleteFollow(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();

    if (!req.params.model || !req.params.modelId) {
      we.log.warn('unFollow:Model name or modelId not found', req.params.model, req.params.modelId);
      return res.badRequest();
    }

    we.db.models.follow
    .unFollow(req.params.model, req.params.modelId, req.user.id, function(err) {
      if (err) return res.serverError(err);

      return res.status(204).send();
    });
  }

};
