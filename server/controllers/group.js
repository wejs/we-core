var _ = require('lodash');

module.exports = {
  findNewGroupsToUser: function findNewGroupsToUser(req, res) {
    var we = req.getWe();

    if (req.query.findNewForUserId) {
      if (!res.locals.query.include) res.locals.query.include = [];
      res.locals.query.include.push({
        model: we.db.models.user, as: 'users',
        where: {
          id: { $not: req.query.findNewForUserId },
        }
      });
    }

    res.locals.Model.findAndCountAll(res.locals.query)
    .done(function(err, record) {
      if (err) return res.serverError(err);
      res.locals.metadata.count = record.count;
      res.locals.record = record.rows;

      return res.ok();
    });
  },

  join: function join(req, res, next) {
    if (!req.isAuthenticated) return res.forbidden();

    var we = req.getWe();

    res.locals.group.userJoin(req.user.id, function(err, membership) {
      if (err) return res.serverError(err);

      we.db.models.follow.follow('group', res.locals.group.id, req.user.id, function (err, follow) {
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

    var we = req.getWe();

    res.locals.group.addContent(
      req.params.contentModelName, req.params.contentId,
    function (err, groupcontent) {
      if (err) return res.serverError(err);
      if (!groupcontent) return res.serverError('groupcontent is empty in add content');

      return we.hooks.trigger('we:before:send:group:addContent', {
        req: req,
        res: res,
        data: groupcontent
      }, function() {
        // return 200 for added
        res.status(200).send({
          meta: res.locals.metadata
        });
      })
    });
  },

  removeContent: function removeContent(req, res, next) {
    if (!req.params.contentModelName || !req.params.contentId) return next();

    var we = req.getWe();

    res.locals.group.removeContent(
      req.params.contentModelName, req.params.contentId,
    function (err) {
      if (err) return res.serverError(err);

      return we.hooks.trigger('we:before:send:group:removeContent', {
        req: req,
        res: res
      }, function() {
        res.status(204).send();
      });
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
  },

  findContentByType: function findContentByType(req, res, next) {
    var we = req.getWe();

    res.locals.query.where.groupName = 'group';
    res.locals.query.where.groupId = res.locals.group.id;
    res.locals.query.where.contentModelName = req.params.contentModelName;

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
  },

  findMembers: function(req, res, next) {
    var we = req.getWe();

    res.locals.query.where.memberName = 'user';
    res.locals.query.where.modelName = 'group';
    res.locals.query.where.modelId = req.params.groupId;

    if (req.query.roleNames && _.isArray(req.query.roleNames)) {
      res.locals.query.include = [
        { model: we.db.models.membershiprole , as: 'roles', where: {
          name: {
            in: req.query.roleNames
          }
        }}
      ];
    }

    we.db.models.membership.findAndCountAll(res.locals.query)
    .then(function (result){
      res.locals.record = result.rows;
      res.locals.metadata.count = result.count;
      res.ok();
    }).catch(function(err){
      next(err);
    });
  },

  findUserGroups: function(req, res, next) {
    var we = req.getWe();

    res.locals.query.where.memberId = res.locals.user.id;
    res.locals.query.where.memberName = 'user';
    res.locals.query.where.status = 'active';

    we.db.models.membership.findAndCountAll(res.locals.query)
    .then(function (result) {
      res.locals.record = result.rows;
      res.locals.metadata.count = result.count;
      res.ok();
    }).catch(function(err){
      next(err);
    });
  },

  findRoles: function(req, res, next) {
    var we = req.getWe();

    we.db.models.membershiprole.findAndCountAll()
    .then(function (result) {
      res.locals.record = result.rows;
      res.locals.metadata.count = result.count;
      res.ok();
    }).catch(function(err){
      next(err);
    });
  }
}