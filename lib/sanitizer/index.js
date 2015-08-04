/**
 * We.js sanitizer feature used to sanitize model data
 *
 * TODO move to none module
 */
var hooks = require('../hooks');
var sanitizeHtml = require('sanitize-html');
var db = require('../database');

var sanitizer = {};

// TODO move this to we.js config
sanitizer.config = {
  allowedTags: [
    // text blocks
    'p',
    'pre',
    'code',
    'blockquote',
    'br',
    'a', 'img',
    'hr',
    'mention',
    'iframe',
    'div',
    // text format
    'b', 'i', 'em', 'strong',  'u',
    'h1', 'h2', 'h3',
    'h4', 'h5','h6',
    // list
    'ul', 'ol', 'nl', 'li'
  ],
  selfClosing: [
    'br',
    'img',
    'hr'
  ],
  allowedAttributes: {
    'span': [ 'style' ],
    'div': [ 'style' ],
    'i': ['class'],
    'a': ['href', 'alt', 'target', 'type'],
    'img': ['src', 'alt', 'style', 'class', 'data-filename', 'style', 'width', 'height'],
    'iframe': ['src', 'width', 'height', 'frameborder'],
    'mention': ['data-user-id']
  }
};

sanitizer.sanitize = function sanitize(dirty){
  return sanitizeHtml(dirty, sanitizer.config);
};

/**
 * Sanitize all text attrs in one object
 *
 * @param  {Object} obj sanitize obj attrs
 * @return {Object}     return obj
 */
sanitizer.sanitizeAllAttr = function sanitizeAllAttr(obj){
  for (var prop in obj) {

    if (prop !== 'id') {
      if (typeof obj[prop] == 'string') {
        obj[prop] = sanitizer.sanitize(obj[prop]);
      }
    }
  }
  return obj;
};

/**
 * Sanitize all sequelize text record attrs
 *
 * @param  {Object} record     sequelize record to sanitize
 * @param  {String} modelName  model name
 * @return {Object}            return obj
 */
sanitizer.sanitizeModelAttrs = function sanitizeModelAttrs(record, modelName) {
  for (var prop in record.dataValues) {
    if (prop !== 'id') {
      if (typeof record.dataValues[prop] == 'string') {
        // if dont have value
        if (!record.getDataValue(prop)) continue;
        // check skip cfg, skipSanitizer
        if (!db.modelsConfigs[modelName].definition[prop] ||
          db.modelsConfigs[modelName].definition[prop].skipSanitizer
        ) {
          continue;
        }
        // sanitize this value
        record.setDataValue(prop, sanitizer.sanitize(record.getDataValue(prop)));
      }
    }
  }
  return record;
};


/**
 * sequelize hook handler to sanitize all text fields with we sanitizer
 *
 * @param {record}    r
 * @param {options}   opts
 * @param {Function}  done
 */
sanitizer.DBBeforeUpdateAndCreateHook = function DBBeforeUpdateAndCreateHook(r, opts, done) {
  sanitizer.sanitizeModelAttrs(r, this.name);
  done(null, r);
}

// after define all models add term field hooks in models how have terms
hooks.on('we:models:set:joins', function (we, done) {
  var models = we.db.models;
  for (var modelName in models) {
    // set sanitizer hook
    models[modelName].addHook('beforeCreate', 'sanitizeBeforeSv', sanitizer.DBBeforeUpdateAndCreateHook);
    models[modelName].addHook('beforeUpdate', 'sanitizeBeforeUP', sanitizer.DBBeforeUpdateAndCreateHook);
  }

  done();
});

module.exports = sanitizer;