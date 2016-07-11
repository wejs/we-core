/**
 * Libs and functions utils for project development
 *
 */

// single model associations
var singleAssociations = ['belongsTo', 'hasOne'];

module.exports = {
  listFilesRecursive: require('./listFilesRecursive'),
  moment: require('moment'),
  async: require('async'),
  _: require('lodash'),
  mkdirp: require('mkdirp'),
  string: require('string'),
  cookieParser: require('cookie-parser'),
  mime: require('mime'),
  express: require('express'),

  /**
   * Is authenticated method usable if we-plugin-auth not is installed
   *
   * @return {Boolean} True
   */
  isAuthenticated: function isAuthenticated() {
    if (!this.user || !this.user.id) return false;
    return true;
  },
  /**
   * Get redirect url
   * @param  {Object} req express request
   * @param  {[type]} res express response
   * @return {string|null} url or null
   */
  getRedirectUrl: function getRedirectUrl(req) {
    if (req.query) {
      if (req.query.service) {
        if (req.we.config.services && req.we.config.services[req.query.service]) {
          req.we.log.verbose(
            'Service redirect found for service: ', req.we.config.services[req.query.service]
          );
          return req.we.config.services[req.query.service].url
        }
      }

      if (req.query.redirectTo) {
        if (!req.we.router.isAbsoluteUrl(req.query.redirectTo))
          return req.query.redirectTo;
      }
    }

    if (req.body && req.body.redirectTo) {
      if (!req.we.router.isAbsoluteUrl(req.body.redirectTo))
        return req.body.redirectTo;
    }

    return null;
  },

  helper: {
    /**
     * Parse handlebars helper options and return attributes text
     *
     * @param  {Object} options handlebars helper options
     * @return {String}         [description]
     */
    parseAttributes: function parseAttributes(options) {
      var attributes = [];
      // pass helper attributes to link element
      for (var attributeName in options.hash) {
        if (typeof options.hash[attributeName] == 'string') {
          attributes.push(attributeName + '="' + options.hash[attributeName] + '"');
        }
      }

      return attributes.join(' ');
    }
  },

  /**
   * Check if is a NxN association
   *
   * @param  {Object}  association The sequelize association object
   * @return {Boolean}
   */
  isNNAssoc: function isNNAssoc(association) {
    if ( singleAssociations.indexOf( association.associationType ) > -1 ) {
      return true;
    }

    return false;
  }
}