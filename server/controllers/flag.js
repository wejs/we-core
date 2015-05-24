/**
 * FlagController.js
 *
 */

module.exports = {
  _config: {
    rest: false,
    actions: false
  },

  /**
   * get Flag status for one content
   */
  getModelFlags: function getOneFlag(req, res) {
    var we = req.getWe();

    var query = {};

    if (!req.params.model) {
      we.log.warn('Model name not found', req.params.model, req.params.modelId);
      return res.badRequest();
    }

    query.model = req.params.model;
    if (req.params.modelId) query.modelId = req.params.modelId;
    if (req.user.id) query.userId = req.user.id;
    if (req.query.flagType) query.flagType = req.query.flagType;

    we.db.models.flag.findAndCountAll({
      where: query
    }).then( function (result) {
      return res.send({
        flag: result.rows,
        meta: {
          count: result.count
        }
      });

    });
  },

  /**
   * create one flag
   */
  flag: function createFlag(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();

    var we = req.getWe();

    var flagType = req.query.flagType;
    var modelName = req.params.model;
    var modelId = req.params.modelId;
    var userId = req.user.id;

    if (!modelName || !modelId) {
      we.log.warn('Model name or modelId not found', modelName, modelId);
      return res.badRequest();
    }

    if(!flagType) {
      we.log.warn('Cant flag without flagType', modelName, modelId);
      return res.badRequest();
    }

    // check if record exists
    we.db.models.flag.recordExists(modelName, modelId,function(err, record) {
      if (err) {
        we.log.error('Error on check if model exists to flag', modelName, modelId);
        return res.serverError(err);
      }

      if (!record) {
        we.log.error('flag:recordExists type id record dont exist.', modelName, modelId);
        return res.forbidden();
      }

      // check if is flagged
      we.db.models.flag.isFlagged(flagType ,userId, modelName, modelId)
      .then(function(flag) {
        // is following
        if (flag) return res.send({flag: flag});

        we.db.models.flag.create({
          flagType: flagType,
          userId: userId,
          model: modelName,
          modelId: modelId
        })
        .then(function (salvedFlag) {
          // send the change to others user connected devices
          we.io.sockets.in('user_' + userId).emit(
            'flag:flag', salvedFlag
          );

          return res.send({flag: salvedFlag});
        })
      })
    })
  },

  unFlag: function deleteFlag(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();

    var we = req.getWe();

    var modelName = req.params.model;
    var modelId = req.param.modelId;
    var userId = req.user.id;
    var flagType = req.query.flagType;

    if (!modelName || !modelId) {
      we.log.warn('unFlag:Model name or modelId not found', modelName, modelId);
      return res.badRequest();
    }

    if(!flagType) {
      we.log.warn('Cant flag without flagType', modelName, modelId);
      return res.badRequest();
    }

    // check if is following
    we.db.models.flag.isFlagged(flagType, userId, modelName, modelId)
    .then(function isFlaggedCB (flag) {
      if( !flag ) return res.send();

      we.db.models.flag.destroy({id: flag.id})
      .then(function () {

        // send the change to others user connected devices
        we.io.sockets.in('user_' + userId).emit('flag:unFlag', flag);

        // send a 200 response on success
        return res.send();
      });
    })
  }

};
