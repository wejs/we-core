const { jsonAPIParser } = require('../JSONApi.js');

module.exports =  {
  'application/vnd.api+json': jsonAPIParser
};