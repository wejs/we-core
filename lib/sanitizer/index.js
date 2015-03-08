/**
 * We.js sanitizer feature used to sanitize model data
 */

var sanitizeHtml = require('sanitize-html');

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
    //'span': [ 'style' ],
    'a': ['href', 'alt', 'target', 'type'],
    'img': ['src', 'alt', 'style', 'class'],
    'iframe': ['src', 'width', 'height', 'frameborder'],
    'mention': ['data-user-id']
  }
};

sanitizer.sanitize = function sanitize(dirty){
  return sanitizeHtml(dirty, sanitizeConfig);
};

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

module.exports = sanitizer;