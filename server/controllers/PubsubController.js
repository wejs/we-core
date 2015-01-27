/**
 * PubsubController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var _ = require('lodash');

module.exports = {
  subscribe: function subscribeMultipleRecords(req, res) {
    var sails = req._sails;

    validateSubscriptRequest(req, res, function(err) {
      if (err) {
        sails.log.warn('PubSubCotroller:subscribe: Badrequest', err);
        return res.badRequest(err);
      }

      var modelName = req.param('modelName');
      var ids = req.param('ids');
      var Model = sails.models[modelName];

      Model.find({ id: ids })
      .exec(function (err, records) {
        if (err) {
          sails.log.error('Error on get records to subscribe', err)
          return res.serverError();
        }
        if (!records) {
          return res.notFound();
        }

        // use sails.js build in PubSub feature
        Model.subscribe(req.socket, records);
        // respond with 200 for success
        res.send();
      });
    });
  },

  /**
   * Unsubscribe multiples models from socket
   * @todo  check acess with ACL
   */
  unsubscribe: function(req, res) {
    var sails = req._sails;

    validateSubscriptRequest(req, res, function(err){
      if (err) {
        sails.log.warn('PubSubCotroller:unsubscribe: Badrequest', err);
        return res.badRequest(err);
      }

      var modelName = req.param('modelName');
      var ids = req.param('ids');
      var Model = sails.models[modelName];

      // -- end valid the request

      Model.find({ id: ids })
      .exec(function (err, records) {
        if (err) {
          sails.log.error('Error on get records to update')
          return res.serverError();
        }
        if (!records) {
          return res.notFound();
        }

        // use sails.js build in PubSub feature
        Model.subscribe(req.socket, records);
        // respond with 200 for success
        res.send();
      });
    })

  }
}

function validateSubscriptRequest(req, res, cb) {
  var sails = req._sails;

  // valid the request
  // TODO move to one police
  if ( !req.isSocket ) {
    return cb('Only can unsubscribe in socket.io');
  }

  var modelName = req.param('modelName');
  var ids = req.param('ids');

  if ( !ids || !modelName ) {
    return cb('ids and modelName params is required');
  }

  if ( !_.isArray(ids) || !_.isString(modelName)  ) {
    return cb('ids param need be a array or modelName need be a string');
  }

  if (!sails.models[modelName]) {
    return cb('Model not found');
  }

  if (!ids.length || ids.length > 100 ) {
    return cb('Model id length is invalid ');
  }

  return cb();
}