/**
 * We menu helper
 *
 * render one menu from app configs
 *
 * usage:  {{#we-menu 'manuName'}} {{/we-menu}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  function renderLinks(links, __, ctx) {
    var html = '';
    for (var i = 0; i < links.length; i++) {
      html += renderLink(links[i], __, ctx);
      if (links[i].links) {
       html += renderLinks(links, __, ctx);
      }
    }
    return html;
  }
  function renderLink(link, __, ctx) {
    if (link.roles && !we.config.acl.disabled) {
      if (!haveAccess(ctx.userRoleNames, link.roles)) return '';
    }

    switch (link.type) {
      case 'route':
        return '<li class="'+(link.class || '')+'"><a href="'+we.router.urlTo(link.name, link.params, we)+'" '+
        (link.attrs || '')+'>'+(link.beforeText || '')+
        ' '+__(link.text)+
          ' '+ (link.afterText || '') + '</a></li>';
      case 'model':
        return '';
      case 'external':
        return '<li class="'+(link.class || '')+'"><a href="'+link.href+'" '+(link.attrs || '')+'>'+
        (link.beforeText || '') +' '+__(link.text)+
          ' '+ (link.afterText || '') + '</a></li>';
      default:
        return '';
    }
  }

  function haveAccess(userRoles, linkRoles) {
    for (var i = 0; i < linkRoles.length; i++) {
       if (userRoles.indexOf(linkRoles[i]) >-1) return true;
     };
     return false;
  }

  return function renderWidget(name) {
    var options = arguments[arguments.length-1];
    var ctx = ( options.data.root.req || options.data.root.locals.req );

    var __ = (this.__ || we.i18n.__);

    if (!we.config.menu[name]) {
      we.log.verbose('Menu not found with name:', name);
      return '';
    }

    var links =  we.config.menu[name].links;
    if (!links) {
      we.log.verbose('Links not found for menu:', name);
      return '';
    }

    var attributes = [];
    // pass helper attributes to link element
    for (var attributeName in options.hash) {
      attributes.push(attributeName + '="' + options.hash[attributeName] + '"');
    }

    var html = '<ul class="'+(we.config.menu[name].class || '')+'" '+ attributes.join(' ') +'>';

    html += renderLinks(links, __, ctx);

    html += '</ul>';

    return new hbs.SafeString(html);
  }
}
