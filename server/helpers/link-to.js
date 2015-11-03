/**
 * Link to helper
 *
 * usage:
     {{#link-to 'routeName' class="btn btn-default"}}Text inside the link{{/link-to}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function linkTo(name) {
    var options = arguments[arguments.length-1];
    var href = '';
    var route = {};

    if (we.router.routeMap.get[name]) {
      route = we.router.routeMap.get[name];
      var mapI = 1;
      for (var i = 0; i < route.map.length; i++) {
        // skip empty path parts linke  // and fist /
        if (!route.map[i]) continue;
        if (typeof route.map[i] == 'string') {
          href += '/' + route.map[i];
        } else if (arguments[mapI]){
          href += '/' + arguments[mapI];
          mapI++;
        } else {
          we.log.warn('Invalid or undefined argument: ' + arguments[i-1] +' ', route.map[i]);
        }
      }
    } else {
      we.log.warn('Route map not found: ' + name);
    }

    if (route.map && route.map.length && !href) href = '/';

    // suport to route alias
    href = we.router.alias.resolvePath(href);

    var attributes = we.utils.helper.parseAttributes(options);

    var l = '<a href="' + href + '" ' + attributes + ' >';
      l += options.fn(this);
    l += '</a>';

    return new hbs.SafeString(l);
  }
}