/**
 * UsersController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

// sails controller utils
//var actionUtil = require('we-helpers').actionUtil;
var util = require('util');
var _ = require('lodash');
var async = require('async');

module.exports = {

  findOneByUsername: function findOneByUsername (req, res, next) {
    var we = req.getWe();

    var username = req.params.username;

    if(!username) return next();

    req.context.Model.find({
      where: { username: username }
    })
    .done(function found(err, user) {
      if (err) {
        we.log.error('findOneByUsername:Error in find user by username', err);
        return res.serverError(err);
      }

      if(!user) return next();

      return res.ok(user);
    });
  },

  findOne: function findOneRecord (req, res, next) {
    var we = req.getWe();
    // Look up the model
    var pk = req.params.id;
    if (!pk || !Number(pk)) {
      // id is invalid
      return next();
    }

    req.context.Model.find(pk)
    .done(function(err, user) {
      if (err) {
        we.log.error('UserController: Error on find user', err);
        return res.serverError(err);
      }

      if (!user) {
        we.log.silly('User not found:', pk);
        return res.notFound();
      }

      return res.ok(user);
    });
  },

  /**
   * Create user route
   *
   * Protect this route with acl!
   */
  create: function createRecord (req, res) {
    var we = req.getWe();

    req.context.Model.create(req.body)
    .done(function(err, record) {
      if (err) {
        return res.serverError(err);
      }

      return res.created(record);
    });
  },

  update: function updateRecord(req, res) {
    var we = req.getWe();

    var pk = req.params.id;

    req.context.Model.find(pk)
    .done(function (err, user){
      if (err) {
        we.log.error('Error on find user by id.', pk, err);
        return res.serverError();
      }

      user.updateAttributes(req.body)
      .done(function(err) {
        if (err) {
          we.log.error('Error on update user', pk, req.params, err);
          return res.serverError();
        }
        return res.ok(user);
      })
    });
  },

  destroy: function(req, res) {
    // user account delete dont are implemented
    return res.notFound();
  }
};
