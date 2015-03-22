/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var util = require('util');
//var WN = require(cwd + '/node_modules/we-plugin-notification');
var _ = require('lodash');
var async = require('async');

module.exports = {
  create: function (req, res) {
    var we = req.getWe();

    var comment = req.body;

    if (req.user) {
      comment.creatorId = req.user.id;
    }

    res.locals.Model.create(comment)
    .done(function (err, newInstance) {
      if (err) return res.serverError(err);

      async.parallel([
        // function updateModelMentions(done) {
        //   if (!req._sails.models.mention) return done();
        //   // update comment mentions
        //   req._sails.models.mention
        //   .updateModelMentions(
        //     req.user, 'body',
        //     newInstance.body,
        //     'comment',
        //     newInstance.id,
        //     function(err, mentionedUsers) {
        //       if (err) {
        //         we.log.error('comment:create:Error on updateModelMentions', err);
        //         return done(err);
        //       }

        //       newInstance.mentions = mentionedUsers;
        //       done();
        //     }
        //   );
        // },
        // function registerActivity(done) {
        //   if (!req._sails.models.activity) return done();
        //   // register one activity on create
        //   req._sails.models.activity.create({
        //     actor: newInstance.creator,
        //     verb: req.options.controller + '_' + req.options.action,
        //     modelName: 'comment',
        //     modelId: newInstance.id
        //   }).exec(function(error, activity) {
        //     // if has one error in activity creation, log it
        //     if (error) {
        //       we.log.error('CommentModel:create: error on create Activity: ',error);
        //       return done(error);
        //     }
        //     done();
        //   });
        // }
      ], function(err) {
        if(err) return res.serverError(err);

        //WN.notify('comment', 'created', newInstance, req.user);

        res.created(newInstance);
      })

    });
  },

  findOne: function (req, res) {
    var we = req.getWe();

    if (!res.locals.record) return res.notFound();

    res.ok();
  },

  find: function findRecords (req, res) {
    var we = req.getWe();

    var modelName = req.query.modelName;
    var modelId = req.query.modelId;

    res.locals.query.where.modelName = modelName;
    res.locals.query.where.modelId = modelId;


    res.locals.Model.findAll(res.locals.query)
    .done(function(err, comments) {
      if(err) return res.serverError(err);

      return res.ok(comments);
    })
  },

  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); }
};
