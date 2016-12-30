const { jsonAPIFormater } = require('../JSONApi'),
      { jsonFormater } = require('../JSONF');

/**
 * We.js core response formatters
 */
module.exports = {
  json: jsonFormater,
  'application/json': jsonFormater,
  'application/vnd.api+json': jsonAPIFormater
};