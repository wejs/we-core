/**
 * If condition helper
 *
  {{#ifCond v1 v2}}
      {{v1}} is equal to {{v2}}
  {{else}}
      {{v1}} is not equal to {{v2}}
  {{/ifCond}}
 */

module.exports = function() {
  return function ifCondHelper(v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
}