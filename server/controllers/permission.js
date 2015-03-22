/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var async = require('async');
var _= require('lodash');

module.exports = {
  find: function findAll(req, res) {
    var we = req.getWe();

    res.locals.query.include = [
      { model: we.db.models.role, as: 'roles', attributes: ['id'] }
    ];

    res.locals.Model.findAll( res.locals.query )
    .done(function found(err, matchingRecords) {
      if (err) return res.serverError(err);
      res.ok(matchingRecords);
    });
  },

  create: function (req, res) { return res.notFound(); },

  /**
   * Add role to permission action
   */
  addRoleToPermission: function(req, res) {
    var we = req.getWe();

    var roleName = req.body.roleName;
    if(!roleName) return res.badRequest('permission.roleName.required');

    res.locals.Model.find(req.params.id)
    .done(function(err, permission) {
      if (err) return res.serverError(err);

      we.acl.addRoleToPermission(we, roleName, permission.name, function(err, permission) {
        if (err) return res.serverError(err);

        res.ok(permission);
      })
    })
  },

  update: function updateOneRecord (req, res) { return res.forbidden();  },

  delete: function (req, res) { return res.notFound(); },
  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); },

  /**
   * Find, register and return all action permissions avaible
   */
  fetchActionPermissions: function (req, res) {
    var we = req.getWe();

    var redirectPath = req.query.redirect;

    we.acl.getAllActionPermisons(we, function (err, permissions) {
      if (err) return res.serverError(err);

      var permissionNames = Object.keys(permissions);
      var permissionsList = [];

      async.each(permissionNames, function(name, next) {
        we.db.models.permission.find({
          where:{ name: name },
          include: [ {all : true, attributes: ['id'] }]
        }).done(function(err, result) {
          if (err) return next(err);
          if (result && result.id) {
            permissionsList.push(result);
            return next();
          }

          we.db.models.permission.create(permissions[name])
          .done(function(err, result) {
            if(err) return next(err);
            permissionsList.push(result);
            return next();
          })
        })
      }, function(err) {
        if ( err ) return res.serverError(err);

        if (redirectPath) {
          return res.redirect(redirectPath);
        }

        res.ok(permissionsList);

      })
    })
  }

};
