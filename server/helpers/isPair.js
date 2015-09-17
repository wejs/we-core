/**
 * Check if one number is pair 0, 2, 4 ...
 *
  {{#isPair number}}
    is pair/even
  {{else}}
    is odd
  {{/isPair}}
 */
module.exports = function() {
  return function isPairHelper(index) {
    var options = arguments[arguments.length-1];
    if ( (index % 2) === 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
}