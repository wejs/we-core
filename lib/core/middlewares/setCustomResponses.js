/**
 * Custom we.js responses feature
 */

var requireAll = require('require-all');
var path = require('path');

module.exports = function setCustomResponses(req, res, next) {
  var responses = requireAll({
    dirname     :  path.resolve( __dirname, '..', 'responses'),
    filter      :  /(.+)\.js$/
  });

  for (var response in responses ) {
    res[response] = responses[response].bind({req: req, res: res, next: next});
  }

  return next();
}