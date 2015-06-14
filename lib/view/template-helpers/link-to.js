/**
 * Link to helper
 *
 * usage:  {{#link-to 'routeName' class="btn btn-default"}}Text inside the link{{/link-to}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function linkTo(name) {
    var options = arguments[arguments.length-1];
    var href = '';
    var route = {};

    if (we.router.routeMap.get[name]) {
      route = we.router.routeMap.get[name];
      for (var i = 0; i < route.map.length; i++) {
        // skip empty path parts linke  // and fist /
        if (!route.map[i]) continue;
        if (typeof route.map[i] == 'string') {
          href += '/' + route.map[i];
        } else if (arguments[i-1]){
          href += '/' + arguments[i-1];
        } else {
          throw new Error('Invalid or undefined argument:', arguments[i-1], route.map[i]);
        }
      }
    } else {
      throw new Error('Route map not found:', name);
    }

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