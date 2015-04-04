module.exports = {
  join: function join(req, res, next) {
    if (!req.isAuthenticated) return res.forbidden();

    var we = req.getWe();

    res.locals.group.userJoin(req.user.id, function(err, membership) {
      if (err) return res.serverError(err);

      we.db.models.follow.follow(req.params.model, req.params.modelId, req.user.id, function (err, follow) {
        if (err) return res.serverError(err);
        if (!follow) return res.forbidden();

        res.status(200).send({
          membership: membership,
          follow: follow
        });
      });
    });
  },

  leave: function leave(req, res, next) {
    if (!req.isAuthenticated) return res.forbidden();

    res.locals.group.userLeave(req.user.id, function(err) {
      if (err) return res.serverError(err);
      res.status(204).send();
    });
  },

  ///api/v1/group/:id/addContent/:contentModelName/:contentId'
  addContent: function addContent(req, res, next) {
    if (!req.params.contentModelName || !req.params.contentId) return next();

    res.locals.group.addContent(
      req.params.contentModelName, req.params.contentId,
    function (err, groupcontent) {
      if (err) return res.serverError(err);
      if (!groupcontent) return res.serverError('groupcontent is empty in add content');
      // return 200 for added
      res.status(200).send();
    });
  },

  removeContent: function removeContent(req, res, next) {
    if (!req.params.contentModelName || !req.params.contentId) return next();

    res.locals.group.removeContent(
      req.params.contentModelName, req.params.contentId,
    function (err) {
      if (err) return res.serverError(err);
      res.status(204).send();
    });
  },

  findAllContent: function findAllContent(req, res, next) {
    var we = req.getWe();

    res.locals.query.where.groupName = 'group';
    res.locals.query.where.groupId = res.locals.group.id;

    we.db.models.groupcontent.findAndCountAll(res.locals.query)
    .done(function(err, result) {
      if (err) return res.serverError(err);

      res.locals.record = result.rows;

      return res.status(200).send({
        groupcontent: result.rows,
        meta: {
          count: result.count
        }
      });
    });
  }
}