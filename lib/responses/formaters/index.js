
/**
 * We.js core response formats
 */

var _ = require('lodash');

module.exports = {
  /**
   * Html response type, rende one page with layout, regions and widgets
   *
   * @param  {Object} data
   * @param  {Object} req  Express.js request
   * @param  {Object} res  Express.js response
   * @return {String}      html page
   */
  html: function htmlFormater(req, res) {
    res.send(res.renderPage(req, res, res.locals.data));
  },

  /**
   * Response type for send html for we.js modals, only render template
   * For use this formater set the query param to: responseType=modal
   *
   * @return {String}
   */
  modal: function modalFormater(req, res) {
    res.send(req.we.view.renderTemplate(res.locals.template, res.locals.theme, res.locals));
  },

  /**
   * JSON response format
   *
   * @param  {Object} data
   * @param  {Object} req  Express.js request
   * @param  {Object} res  Express.js response
   * @return {Object}      JS object to send with res.send
   */
  json: function jsonFormater(req, res) {
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

    if (!_.isEmpty( res.locals.messages) ) {
      // set messages
      response.messages = res.locals.messages;
    }

    res.send(response);
  }
};

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
      } else if ( _.isObject(record[ associationName ] && record[ associationName ].id) ) {
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