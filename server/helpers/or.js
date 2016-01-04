/**
 * OR condition helper
 *
  {{#or v1 v2 v3}}
      one param is true
  {{else}}
      all params is false
  {{/or}}
 */

module.exports = function() {
  return function ifCondHelper() {
    var options = arguments[arguments.length-1];
    // check if one param is true
    for (var i = 0; ( i < arguments.length && i != (arguments.length-1) ); i++) {
      if(arguments[i]) return options.fn(this);
    }
    // else
    return options.inverse(this);
  }
}