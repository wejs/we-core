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
    var sails = req._sails;
    // Look up the model
    var Model = sails.models.user;

    var username = req.param('username');

    if(!username) return next();

    if (!Model.validUsername(username)) return next();

    var query = Model.findOneByUsername(username);
    //query = actionUtil.populateEach(query, req.options);
    query.exec(function found(err, user) {
      if (err) {
        sails.log.error('findOneByUsername:Error in find user by username', err);
        return res.serverError(err);
      }

      if(!user) return next();
      // save request in user var for toJSON
      user.req = req;

      if (req.wantsJSON) {
        return res.ok(user);
      }

      if(!user){
        return res.redirect('/login')
      }

      res.locals.messages = [];
      res.locals.user = user;
      res.locals.formAction = '/account';
      res.locals.service = req.param('service');
      res.locals.consumerId = req.param('consumerId');

      res.locals.interests = [];

      return res.view('user/user');
    });
  },

  findOne: function findOneRecord (req, res) {
    var sails = req._sails;
    // Look up the model
    var Model = sails.models.user;
    var pk = req.param('id');

    return Model.findOneById(pk)
    .exec(function found(err, user) {
      if (err) {
        sails.log.error('UserController: Error on find user', err);
        return res.serverError(err);
      }

      // save request in user var for toJSON
      user.req = req;

      if (!user) {
        return res.notFound();
      }

      return res.ok(user);
    });
  },

  find: function findRecords (req, res) {
    var sails = req._sails;
    // Look up the model
    var Model = sails.models.user;

    // Lookup for records that match the specified criteria
    var query = Model.find()
    .where( actionUtil.parseCriteria(req) )
    .limit( actionUtil.parseLimit(req) )
    .skip( actionUtil.parseSkip(req) )
    .sort( actionUtil.parseSort(req) );
    // TODO: .populateEach(req.options);
    //query = actionUtil.populateEach(query, req.options);
    query.exec(function found(err, matchingRecords) {
      if (err) {
        sails.log.error('find:Error on find users', err);
        return res.serverError(err);
      }

      _.each(matchingRecords, function (record) {
        // save request in user var for toJSON
        record.req = req;
      });

      return res.ok(matchingRecords);
    });
  },

  create: function createRecord (req, res, next) {
    req._sails.log.warn('only create user with auth plugin')
    return next();
  },

  update: function updateUserProfile(req, res) {
    if(!req.isAuthenticated()) return res.forbidden();

    var sails = req._sails;
    // Look up the model
    var Model = sails.models.user;
    var pk = req.param('id');

    // forbidden one account woner can update profile
    // if(req.user.id != pk) return res.forbidden();

    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)
    var values = actionUtil.parseValues(req);

    // Omit the path parameter `id` from values, unless it was explicitly defined
    // elsewhere (body/query):
    var idParamExplicitlyIncluded = ((req.body && req.body.id) || req.query.id);
    if (!idParamExplicitlyIncluded) delete values.id;

    // remove createdAt and updatedAt to let sails.js set it automaticaly
    delete values.createdAt;
    delete values.updatedAt;

    res.locals.user = values;
    res.locals.formAction = '/account';
    res.locals.service = req.param('service');
    res.locals.consumerId = req.param('consumerId');

    return Model.findOneByUsername(values.username).exec(function(err, usr){
      if (err) {
        sails.log.error('Error on find user by username.',err);
        res.locals.messages = [{
          status: 'danger',
          message: res.i18n('auth.register.error.unknow', { username: values.username })
        }];
        return res.serverError({}, 'auth/register');
      }

      // user already registered
      if (usr && (usr.id != pk) ) {
        res.locals.messages = [{
          status: 'danger',
          message: res.i18n('auth.register.error.username.registered', { username: values.username })
        }];
        return res.badRequest({}, 'auth/register');
      }

      // Find and update the targeted record.
      //
      // (Note: this could be achieved in a single query, but a separate `findOne`
      //  is used first to provide a better experience for front-end developers
      //  integrating with the blueprint API.)
      return Model.findOne(pk).exec(function found(err, matchingRecord) {

        if (err) return res.serverError(err);
        if (!matchingRecord) return res.notFound();

        // dont allow to change admin and moderator flags here
        values.isAdmin = matchingRecord.isAdmin;
        values.isModerator = matchingRecord.isModerator;
        // dont change user password in user edit
        values.password = matchingRecord.password;
        // dont change roles on update
        values.roles = matchingRecord.roles;

        return Model.update(pk, values).exec(function updated(err, records) {

          // Differentiate between waterline-originated validation errors
          // and serious underlying issues. Respond with badRequest if a
          // validation error is encountered, w/ validation info.
          if (err) {
            sails.log.error('Error on update user', err);
            return res.negotiate(err);
          }

          // Because this should only update a single record and update
          // returns an array, just use the first item.  If more than one
          // record was returned, something is amiss.
          if (!records || !records.length || records.length > 1) {
            req._sails.log.warn(
            util.format('Unexpected output from `%s.update`.', Model.globalId)
            );
          }

          var updatedRecord = records[0];
          updatedRecord.req = req;

          if(req.wantsJSON){
            return res.ok(updatedRecord);
          }

          res.locals.messages = [{
            status: 'success',
            message: res.i18n('user.account.update.success',{
              displayName: updatedRecord.displayName
            })
          }];
          res.locals.user = updatedRecord;

          return res.view('user/account');

        });// </updated>
      }); // </found>
    });
  },

  destroy: function(req, res) {
    // user account delete dont are implemented
    return res.notFound();
  },

  // block add and remove routes
  add: function(req, res) { return res.notFound(); },
  remove: function(req, res) { return res.notFound(); }
};
