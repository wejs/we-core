/**
 * Libs and functions utils for project development
 *
 */

const fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  // single model associations
  singleAssociations = ['belongsTo', 'hasOne'],
  slugify = require('slugify');

const utils = {
  listFilesRecursive: walk,
  moment: require('moment'),
  async: require('async'),
  _: _,
  mkdirp: require('./mkdirp.js'),
  cookieParser: require('cookie-parser'),
  mime: require('mime'),
  express: require('express'),
  slugify: slugify,

  /**
   * Strip tags from string
   *
   * @param  {String} string String to cleanup
   * @return {String}        String without tags
   */
  stripTags(string = '') {
    return string.replace(/<\/?[^>]+(>|$)/g, '');
  },

  /**
   * Strip tags and truncate
   *
   * Usage: stripTagsAndTruncate('something big', 5, '......')
   *
   * @param  {String} string   String to cleanup and truncate
   * @param  {Number} length   Length to truncate if it is too big
   * @param  {String} omission default: ...
   * @return {String}          Clean and truncated string
   */
  stripTagsAndTruncate(string, length = 200, omission = '...') {
    return _.truncate(utils.stripTags(string), {
      length: length,
      omission: omission
    });
  },

  /**
   * Slugfy and truncate
   *
   * Usage: slugifyAndTruncate('something big', 5, '......')
   *
   * @param  {String} string   String to cleanup and truncate
   * @param  {Number} length   Length to truncate if it is too big
   * @param  {String} omission default: ...
   * @param  {Object} opts     slugfy options
   * @return {String}          Clean and truncated string
   */
  slugifyAndTruncate(string, length = 200, omission = '...', opts = {}) {
    return _.truncate(slugify(string, opts), {
      length: length,
      omission: omission
    });
  },

  /**
   * Is authenticated method usable if we-plugin-auth not is installed
   *
   * @return {Boolean} True
   */
  isAuthenticated() {
    if (!this.user || !this.user.id) return false;
    return true;
  },
  /**
   * Get redirect url
   * @param  {Object} req express request
   * @param  {[type]} res express response
   * @return {string|null} url or null
   */
  getRedirectUrl(req) {
    if (req.query) {
      if (req.query.service) {
        if (req.we.config.services && req.we.config.services[req.query.service]) {
          req.we.log.verbose(
            'Service redirect found for service: ', req.we.config.services[req.query.service]
          );
          return req.we.config.services[req.query.service].url;
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
    parseAttributes(options) {
      let attributes = [];
      // pass helper attributes to link element
      for (let attributeName in options.hash) {
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
  isNNAssoc(association) {
    if ( singleAssociations.indexOf( association.associationType ) > -1 ) {
      return true;
    }

    return false;
  }
};

/**
 * List files in dir in parallel
 *
 * see: http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
 *
 * @param  {String}   dir
 * @param  {Function} done run with error, files
 */
function walk(dir, done) {
  var results = [];

  fs.readdir(dir, (err, list)=> {
    if (err) {
      if (err.code === 'ENOENT') {
        return done(null, []);
      } else {
        return done(err);
      }
    }
    let pending = list.length;
    if (!pending) return done(null, results);

    list.forEach( (file)=> {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat)=> {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res)=> {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

module.exports = utils;
