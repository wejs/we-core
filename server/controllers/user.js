/**
 * user controller
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  findOneByUsername: function findOneByUsername (req, res, next) {
    if(!req.params.username) return next();

    res.locals.Model.findOne({
      where: { username: req.params.username }
    }).then(function (user) {
      if(!user) return next();
      return res.ok(user);
    });
  },

  create: function create(req, res) {
    var we = req.we;

    if (!res.locals.template) res.locals.template = res.locals.model + '/' + 'create';

    if (!res.locals.data) res.locals.data = {};

    we.utils._.merge(res.locals.data, req.query);

    if (req.method === 'POST') {
      // auto accept terms in register user
      req.body.acceptTerms = true;

      // set temp record for use in validation errors
      res.locals.data = req.query;
      we.utils._.merge(res.locals.data, req.body);

      return res.locals.Model.create(req.body)
      .then(function (record) {
        res.locals.data = record;
        res.created();
      }).catch(res.queryError);
    } else {
      res.locals.data = req.query;
      res.ok();
    }
  },

  edit: function edit(req, res, next) {
    var we = req.we;

    if (!res.locals.template)
      res.locals.template = res.locals.model + '/' + 'edit';

    if (!we.acl.canStatic('manage_users', req.userRoleNames)) {
      delete req.body.email;
      delete req.body.active;
    }

    var record = res.locals.data;

    if (we.config.updateMethods.indexOf(req.method) >-1) {
      if (!record) return next();

      record.updateAttributes(req.body)
      .then(function() {
        res.locals.data = record;
        return res.updated();
      }).catch(res.queryError);
    } else {
      res.ok();
    }
  }
};
