/**
 * We menu helper
 *
 * render one menu from app configs
 *
 * usage:  {{#we-menu 'menuName'}} {{/we-menu}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function renderWidget(menu) {
    var options = arguments[arguments.length-1];
    var req = options.data.root.req || options.data.root.locals.req;

    if (!(menu instanceof we.class.Menu) )
      menu = new we.class.Menu(menu);

    return new hbs.SafeString( menu.render( req ) );
  }
}
