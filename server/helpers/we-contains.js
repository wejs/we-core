/**
 * Check if one array contains a value
 *
  {{#contains array value}}
      {{array}} contains {{value}}
  {{else}}
      {{array}} not contains {{value}}
  {{/contains}}
 */

module.exports = function() {
  return function renderWidget(array, value, options) {
    if (!array) return options.inverse(this);
    if (array.indexOf(value) >-1) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
}