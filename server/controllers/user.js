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
  },

  findUserPrivacity: function findUserPrivacity(req, res, next) {
    if (!res.locals.user) return res.notFound();

    if (
      !req.isAuthenticated() ||
      !(
        res.locals.user.id == req.user.id ||
        req.we.acl.canStatic('update_user', req.userRoleNames)
      )
    ) {
      return res.forbidden();
    }

    res.locals.userAttributes = req.we.config.privacity.userFields.changeable;
    res.locals.publicFields = req.we.config.privacity.userFields.public;

    req.we.db.models.userPrivacity.findAll({
      where: {
        userId: res.locals.user.id
      }
    }).then(function (r) {
      res.locals.data = {};

      if (r) {
        for (var i = 0; i < res.locals.userAttributes.length; i++) {
          res.locals.data[res.locals.userAttributes[i]] = {};

          for (var j = 0; j < r.length; j++) {
            if (r[j].field == res.locals.userAttributes[i]) {
              res.locals.data[res.locals.userAttributes[i]].record = r[j];
            }
          }
        }
      }

      if (req.method == 'POST') {
        return req.we.controllers.user.updateUserPrivacity(req, res, next);
      } else {
        res.ok();
      }
    }).catch(res.queryError);
  },

  updateUserPrivacity: function updateUserPrivacity(req, res) {
    // for each field ...
    req.we.utils.async.eachSeries(res.locals.userAttributes,
    function (fieldName, next) {
      // if user dont changed field with fieldName
      if (!req.body[fieldName]) return next();

      if (!res.locals.data[fieldName]) res.locals.data[fieldName] = {};

      // update if already are loaded
      if (res.locals.data[fieldName].record) {
        res.locals.data[fieldName].record.set('privacity', req.body[fieldName]);
        res.locals.data[fieldName].record.save()
        .then(function (r) {
          res.locals.data[fieldName].record = r;

          next();
        }).catch(next);
      } else {
        // create if dont are loaded
        req.we.db.models.userPrivacity.findOrCreate({
          where: {
            userId: res.locals.user.id,
            field: fieldName
          },
          defaults: {
            userId: res.locals.user.id,
            field: fieldName,
            privacity: req.body[fieldName]
          }
        }).spread(function (r) {
          res.locals.data[fieldName].record = r;
          next();
        }).catch(next);
      }
    }, function (err) {
      if (err) return res.queryError(err);
      res.updated();
    });
  }
};
