/**
 * Check if variable is array
 *
  {{#isArray array}}
      is array
  {{else}}
      not array
  {{/isArray}}
 */

module.exports = function(we) {
  return function renderWidget(v1) {
    var options = arguments[arguments.length-1];
    if (we.utils._.isArray(v1)) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
}