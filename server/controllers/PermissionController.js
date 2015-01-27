/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var async = require('async');
var _= require('lodash');
var actionUtil = require('we-helpers').actionUtil;

module.exports = {
  find: function (req, res) {
    var Model = req._sails.models.permission;

    var query = Model.find()
    .limit( 300 )
    // TODO: .populateEach(req.options);
    query = actionUtil.populateEach(query, req);
    query.exec(function found(err, matchingRecords) {
      if (err) return res.serverError(err);
      res.ok(matchingRecords);
    });
  },

  create: function (req, res) {
    return res.notFound();
  },

  // update: function (req, res, next) {
  //   console.log('@todo role update');
  //   next();
  // },

  delete: function (req, res, next) {
    console.log('@todo PermissionController delete');
    next();
  },

  add: function (req, res, next) {
    console.log('@todo PermissionController add');
    next();
  },

  remove: function (req, res, next) {
    console.log('@todo PermissionController remove');
    next();
  },

  /**
   * Find, register and return all action permissions avaible
   */
  fetchActionPermissions: function (req, res) {
    // if ( !req.isAuthenticated() ) return res.forbidden();
    // if ( !req.user.isAdmin ) return res.forbidden();

    var Permission = req._sails.models.permission;

    req._sails.acl.getAllActionPermisons(req._sails, function (err, permissions) {
      if (err) {
        req._sails.log.error('PermissionsController:fetchActionPermissions: ', err);
        return res.serverError(err);
      }

      var permissionNames = Object.keys(permissions);
      var permissionsList = [];

      async.each(permissionNames, function(name, next) {
        Permission.findOneByName(name, function(err, result) {
          if (err) return next(err);
          if (result && result.id) {
            permissionsList.push(result);
            return next();
          }

          Permission.create(permissions[name])
          .exec(function(err, result) {
            if(err) return next(err);
            permissionsList.push(result);
            return next();
          })
        })
      }, function(err) {
        if ( err ) {
          req._sails.log.error('PermissionsController:fetchActionPermissions:', err);
          return res.serverError(err)
        }
        res.send({permission: permissionsList});
      })
    })
  }

};
