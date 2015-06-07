var _ = require('lodash');

module.exports = {
  json: function(data, req, res) {
    if (!res.locals.model) {
      // set messages
      data.messages = res.locals.messages;
      return data;
    }

    var response = parseResponse(req, res, data);

    response.meta = res.locals.metadata;

    if (!_.isEmpty( res.locals.messages) ) {
      // set messages
      response.messages = res.locals.messages;
    }
    return response;
  }
};

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
var singleAssociations = ['belongsTo', 'hasOne'];

function parseRecord( req, res, record) {

  for (var associationName in res.locals.Model.associations) {
    if (!record[associationName]) {
      if ( record.dataValues[ associationName + 'Id' ] ) {
        record.dataValues[ associationName ] = record[ associationName + 'Id' ];
      }
    } else {
      if (record.dataValues[ associationName + 'Id' ]) {
        record.dataValues[ associationName ] = record[ associationName + 'Id' ];
      } else if ( _.isObject(record[ associationName ] && record[ associationName ].id) ) {
        record.dataValues[ associationName ] = record[ associationName ].id;
      } else if( isNNAssoc ( record[ associationName ] ) ) {
        record.dataValues[ associationName ] = record[ associationName ].id;
      } else {
        for (var i = record.dataValues[ associationName ].length - 1; i >= 0; i--) {
          record.dataValues[ associationName ][i] = record.dataValues[ associationName ][i].id;
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