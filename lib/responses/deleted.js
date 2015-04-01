var _ = require('lodash');

module.exports = function deletedResponse() {
  var res = this.res;
  var req = this.req;
  var we = req.getWe();

  res.status(204);

  return we.hooks.trigger('we:before:send:deletedResponse', {
    req: req,
    res: res
  }, function() {
    if (!res.locals.responseType || res.locals.responseType == 'html') {
      return res.view();
    }

    if (res.locals.responseType == 'json') {
      if (!res.locals.model) {
        return res.send({
          messages: res.locals.messages,
          meta: res.locals.metadata
        });
      }

      var response = {};

      response.meta = res.locals.metadata;

      if (!_.isEmpty( res.locals.messages) ) {
        // set messages
        response.messages = res.locals.messages;
      }

      return res.send(response);
    }

    we.log.error('Unknow responseType:', res.locals.responseType);
  });
}

function parseResponse(req, res, record) {
  var response = {};

  if ( !_.isEmpty( record ) ) {
    if ( _.isArray(record)) {

      response[res.locals.model] = [];

      for (var i = record.length - 1; i >= 0; i--) {
        response[res.locals.model][i] = parseRecord( req, res, record[i]);
      }
    } else {
      response[res.locals.model] = [ parseRecord( req, res, record ) ];
    }
  } else {
    response[res.locals.model] = [];
  }

  return response;
}

var singleAssociations = ['bellongsTo', 'hasOne'];

function parseRecord( req, res, record) {
  for (var associationName in res.locals.Model.associations) {
    if (!record[associationName]) {
      continue;
    } else {
      if ( isNNAssoc ( record[ associationName ] ) ) {
        record[ associationName ] = record[ associationName ].id;
      } else {
        for (var i = record[ associationName ].length - 1; i >= 0; i--) {
          record[ associationName ][i] = record[ associationName ][i].id;
        }
      }
    }
  }

  return record;
}

function isNNAssoc(association) {
  if ( singleAssociations.indexOf( association.associationType ) > -1 ) {
    return true;
  }

  return false;
}