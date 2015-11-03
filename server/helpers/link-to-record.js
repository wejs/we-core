/**
 * Link to record helper for generate record links
 *
 * usage:
     {{#link-to-record record=record class="btn btn-default"}}Text inside the link{{/link-to-record}}
 */

module.exports = function(we) {
  return function linkTo() {
    var options = arguments[arguments.length-1];

    if (!options.hash.record) return '';

    var href = options.hash.record.getUrlPathAlias();

    var attributes = we.utils.helper.parseAttributes(options);

    var l = '<a href="' + href + '" ' + attributes + ' >';
      l += options.fn(this);
    l += '</a>';

    return new we.hbs.SafeString(l);
  }
}