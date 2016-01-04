/**
 * AND condition helper
 *
  {{#and v1 v2 v3}}
      all param is true
  {{else}}
      one or more params is false
  {{/and}}
 */

module.exports = function() {
  return function ifCondHelper() {
    var options = arguments[arguments.length-1];
    // check if one param is false and return the else block
    for (var i = 0; ( i < arguments.length && i != (arguments.length-1) ); i++) {
      if(!arguments[i]) return options.inverse(this);
    }
    // else
    return options.fn(this);
  }
}