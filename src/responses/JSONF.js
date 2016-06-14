import { isEmpty, isObject } from 'lodash'

let jsonF = {
  /**
   * JSON response format
   *
   * @param  {Object} data
   * @param  {Object} req  Express.js request
   * @param  {Object} res  Express.js response
   * @return {Object}      JS object to send with res.send
   */
  jsonFormater: function jsonFormater (req, res) {
    if (!res.locals.data) res.locals.data = {};

    if (!res.locals.model) {
      // set messages
      res.locals.data.messages = res.locals.messages;
      return res.send(res.locals.data);
    }

    var response = {};

    if (req.we.config.sendNestedModels) {
      response[res.locals.model] = res.locals.data;
    } else {
      response[res.locals.model] = parseRecord(req, res, res.locals.data);
    }

    // check field privacity access
    req.we.db.checkRecordsPrivacity(res.locals.data);

    response.meta = res.locals.metadata;

    if (!isEmpty( res.locals.messages) ) {
      // set messages
      response.messages = res.locals.messages;
    }

    res.send(response);
  }
}


/**
 * Parse one record associations for JSON format to change association model object to association model id
 *
 * @param  {Object} req    Express.js request
 * @param  {Object} res    Express.js response
 * @param  {Obejct} record Record to parse
 * @return {Object}        returns the parsed record
 */
function parseRecord(req, res, record) {
  for (var associationName in res.locals.Model.associations) {
    if (!record[associationName]) {
      if ( record.dataValues[ associationName + 'Id' ] ) {
        record.dataValues[ associationName ] = record[ associationName + 'Id' ];
      }
    } else {
      if (record.dataValues[ associationName + 'Id' ]) {
        record.dataValues[ associationName ] = record[ associationName + 'Id' ];
      } else if ( isObject(record[ associationName ] && record[ associationName ].id) ) {
        record.dataValues[ associationName ] = record[ associationName ].id;
      // if is a NxN association
      } else if( req.we.utils.isNNAssoc ( record[ associationName ] ) ) {
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

module.exports = jsonF