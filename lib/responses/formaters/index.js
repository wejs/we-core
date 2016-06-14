'use strict';

var _JSONApi = require('../JSONApi');

var _JSONF = require('../JSONF');

/**
 * We.js core response formats
 */

module.exports = {
  json: _JSONF.jsonFormater,
  'application/json': _JSONF.jsonFormater,
  'application/vnd.api+json': _JSONApi.jsonAPIFormater
};