/**
 * UsersController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  findOneByUsername: function findOneByUsername (req, res, next) {
    var username = req.params.username;
    if(!username) return next();

    res.locals.Model.find({
      where: { username: username }
    })
    .then(function found(user) {
      if(!user) return next();
      return res.ok(user);
    });
  },

  create: function create(req, res) {
    var we = req.getWe();
    if (!res.locals.template) res.locals.template = res.locals.model + '/' + 'create';

    if (!res.locals.record) res.locals.record = {};

     we.utils._.merge(res.locals.record, req.query);

    if (req.method === 'POST') {
      if (req.isAuthenticated()) req.body.creatorId = req.user.id;
      // auto accept terms in register user
      req.body.acceptTerms = true;

      // set temp record for use in validation errors
      res.locals.record = req.query;
      we.utils._.merge(res.locals.record, req.body);

      return res.locals.Model.create(req.body)
      .then(function (record) {
        res.locals.record = record;
        res.created();
      }).catch(res.queryError);
    } else {
      res.locals.record = req.query;
      res.ok();
    }
  },

  update: function updateRecord(req, res) {
    var we = req.getWe();

    if (! we.acl.canStatic('manage_users', req.userRoleNames)) {
      delete req.body.email;
      delete req.body.active;
    }

    res.locals.record.updateAttributes(req.body)
    .then(function () {
      return res.ok();
    }).catch(function(err) {
      we.log.error('Error on update user', req.body, err);
      return res.serverError();
    })
  },

  edit: function edit(req, res) {
    var we = req.getWe();

    if (!res.locals.template) res.locals.template = res.local.model + '/' + 'edit';

    if (! we.acl.canStatic('manage_users', req.userRoleNames)) {
      delete req.body.email;
      delete req.body.active;
    }

    var record = res.locals.record;

    if (req.method === 'POST') {
      if (!record) return res.notFound();

      record.updateAttributes(req.body)
      .then(function() {
        res.locals.record = record;
        return res.updated();
      }).catch(res.queryError);
    } else {
      res.ok();
    }
  },

  manage: function(req, res, next) {
    var we = req.getWe();

    return we.db.models.user.findAndCountAll(res.locals.query, res.locals.queryOptions)
    .then(function (record) {
      if (!record) return next();

      res.locals.metadata.count = record.count;
      res.locals.record = record.rows;

      return res.ok();
    });
  }
};
