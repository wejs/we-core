/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var async = require('async');
var _= require('lodash');
var actionUtil = require('we-helpers').actionUtil;
var util = require('util');

module.exports = {
  find: function findAll(req, res) {
    var Model = req._sails.models.permission;

    Model.find()
    .limit( 300 )
    .sort('name DESC')
    .populate('roles')
    .exec(function found(err, matchingRecords) {
      if (err) return res.serverError(err);
      res.ok(matchingRecords);
    });
  },

  findOne: function findOneRecord (req, res) {
    var pk = actionUtil.requirePk(req);

    req._sails.models.permission.findOne(pk)
    .populate('roles')
    .exec(function found(err, matchingRecord) {
      if (err) return res.serverError(err);
      if(!matchingRecord) return res.notFound('No record found with the specified `id`.');

      res.ok(matchingRecord);
    });
  },

  create: function (req, res) {
    return res.notFound();
  },

  update: function updateOneRecord (req, res) {
    var Model = req._sails.models.permission;
    // Locate and validate the required `id` parameter.
    var pk = actionUtil.requirePk(req);
    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)

    var roles = req.param('roles');

    // Find and update the targeted record.
    //
    // (Note: this could be achieved in a single query, but a separate `findOne`
    //  is used first to provide a better experience for front-end developers
    //  integrating with the blueprint API.)
    Model.findOne(pk).populateAll().exec(function found(err, matchingRecord) {

      if (err) return res.serverError(err);
      if (!matchingRecord) return res.notFound();

      //only update role
      matchingRecord.roles = roles;

      Model.update(pk, matchingRecord)
      .exec(function updated(err, records) {

        // Differentiate between waterline-originated validation errors
        // and serious underlying issues. Respond with badRequest if a
        // validation error is encountered, w/ validation info.
        if (err) return res.negotiate(err);

        // Because this should only update a single record and update
        // returns an array, just use the first item.  If more than one
        // record was returned, something is amiss.
        if (!records || !records.length || records.length > 1) {
          req._sails.log.warn(
          util.format('Unexpected output from `%s.update`.', Model.globalId)
          );
        }

        var updatedRecord = records[0];

        // If we have the pubsub hook, use the Model's publish method
        // to notify all subscribers about the update.
        if (req._sails.hooks.pubsub) {
          Model.publishUpdate(pk, _.cloneDeep(matchingRecord), !req.options.mirror && req, {
            previous: matchingRecord.toJSON()
          });
        }

        // Do a final query to populate the associations of the record.
        //
        // (Note: again, this extra query could be eliminated, but it is
        //  included by default to provide a better interface for integrating
        //  front-end developers.)
        Model.findOne(updatedRecord.id)
        .populate('roles')
        .exec(function foundAgain(err, populatedRecord) {
          if (err) return res.serverError(err);
          if (!populatedRecord) return res.serverError('Could not find record after updating!');
          // update the acl permissions cache
          req._sails.acl.permissions[populatedRecord.name] = populatedRecord;

          res.ok(populatedRecord);
        }); // </foundAgain>
      });// </updated>
    }); // </found>
  },

  delete: function (req, res) {
    return res.notFound();
  },

  add: function (req, res) {
    return res.notFound();
  },

  remove: function (req, res) {
    return res.notFound();
  },

  /**
   * Find, register and return all action permissions avaible
   */
  fetchActionPermissions: function (req, res) {
    // if ( !req.isAuthenticated() ) return res.forbidden();
    // if ( !req.user.isAdmin ) return res.forbidden();

    var Permission = req._sails.models.permission;
    var redirectPath = req.param('redirect');

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

        if (redirectPath) {
          res.redirect(redirectPath);
        } else {
          res.send({permission: permissionsList});
        }
      })
    })
  }

};
