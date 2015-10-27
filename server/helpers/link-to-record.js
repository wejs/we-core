/**
 * Link to record helper for generate record links
 *
 * usage:  {{#link-to-record record=record class="btn btn-default"}}Text inside the link{{/link-to-record}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function linkTo() {
    var options = arguments[arguments.length-1];

    if (!options.hash.record) return '';

    var href = options.hash.record.getUrlPathAlias();

    var attributes = [];
    // pass helper attributes to link element
    for (var attributeName in options.hash) {
      attributes.push(attributeName + '="' + options.hash[attributeName] + '"');
    }

    var l = '<a href="' + href + '" ' + attributes.join(' ') + ' >';
      l += options.fn(this);
    l += '</a>';

    return new hbs.SafeString(l);
  }
}