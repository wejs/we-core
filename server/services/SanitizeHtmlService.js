var sanitizeHtml = require('sanitize-html');

// TODO move this to sails config
var sanitizeConfig = {
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

exports.sanitize = function(dirty){
  return sanitizeHtml(dirty, sanitizeConfig);
};

exports.sanitizeAllAttr = function(obj){

  for (var prop in obj) {
    if(prop !== 'id'){
      if(typeof obj[prop] == 'string'){
        obj[prop] = SanitizeHtmlService.sanitize(obj[prop]);
      }
    }
  }

  return obj;

  //return sanitizeHtml(dirty, sanitizeConfig);
};

