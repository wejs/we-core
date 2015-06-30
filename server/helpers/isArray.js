/**
 * Check if one variable is array
 *
  {{#isArray array}}
      is array
  {{else}}
      not array
  {{/isArray}}
 */
var _ = require('lodash');

module.exports = function() {
  return function renderWidget(v1) {
    var options = arguments[arguments.length-1];
    if (_.isArray(v1)) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
}