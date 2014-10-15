
/**
 * Mention
 *
 * @module      :: Model
 * @description :: Mention association
 *
 */

var _ = require('lodash');
var async = require('async');

module.exports = {
  schema: true,
  attributes: {
    whoMentioned: {
      type: 'string',
      required: true
    },
    userMentioned: {
      type: 'string',
      required: true
    },
    // model name ex.: post or comment
    modelName: {
       type: 'string'
    },
    modelId: {
      type: 'string'
    },
    // model atribute where user is mentioned
    attribute: {
      type: 'string'
    },
    // // After register one create activity
    // afterCreate: function(record, next) {
    //   sails.log.warn('afterCreate', record);
    //   // emit one event to plug others we.js features
    //   sails.emit('we:model:mention:afterCreate', record);
    //   next();
    // }
  },

  updateModelMentions: function(actor, attribute, mentions, modelName, modelId, cb) {

    if( _.isEmpty(mentions) ) return cb();

    // first get users
    User.find({ username: mentions })
    .exec(function (err, mentionedUsers) {
      if (err) return cb(err);

      // if dont have user mentions then delete old ones
      if ( _.isEmpty(mentionedUsers) ) {
        return cb(null, []);
      }

      // get salved model mentions
      Mention.find({
        modelName: modelName,
        modelId: modelId
      }).exec(function (err, oldMentions) {
        if (err) return cb(err);

        // filter salved mentions
        if( !_.isEmpty(oldMentions) ) {
          for (var i = oldMentions.length - 1; i >= 0; i--) {

            for (var j = mentionedUsers.length - 1; j >= 0; j--) {
              if (oldMentions[i].userMentioned === mentionedUsers[j].id) {
                delete mentionedUsers[i];
                break;
              }
            }
          }
        }

        if ( _.isEmpty(mentionedUsers) ) {
          return cb(null, oldMentions);
        }

        Mention.createMultipleMentions(actor, attribute, mentionedUsers, modelName, modelId, cb);
      });
    });
  },

  createMultipleMentions: function(actor, attribute, users, modelName, modelId, cb) {

    var query = [];
    for (var i = users.length - 1; i >= 0; i--) {
      query.push({
        whoMentioned: actor.id,
        userMentioned: users[i].id,
        modelName: modelName,
        modelId: modelId,
        attribute: attribute
      });
    }

    Mention.create(query).exec(function(err, mentions){
      if ( err ) return cb(err);

      mentions.forEach(function(mention){
        sails.emit('we:model:mention:afterCreate', mention);
      })
    });
  },

  clearModelMentions: function(modelName, modelId, cb) {
    return Mention.destroy({
      modelName: modelName,
      modelId: modelId
    }).exec(cb);
  }
};
