/**
 * We.js user menu helper
 *
 * render user menu
 *
 * usage:  {{#we-user-menu 'menuName'}} {{/we-user-menu}}
 */

module.exports = function(we) {
  return function renderWidget() {
    var html =  '';
    var req;
    // find context to get theme name
    if (this.req) {
      req = this.req;
    } else if (this.locals && this.locals.req) {
      req = this.locals.req;
    } else {
      we.log.warn('we-user-menu:helper:req not found');
      return '';
    }


    if (req.isAuthenticated()) {
      html = '<li class="dropdown">'+
        '<a class="dropdown-toggle" data-toggle="dropdown" href="#" aria-expanded="false">'+
          req.user.displayName+
          '<span class="caret"></span>'+
        '</a><ul class="dropdown-menu">';

      html += '<li><a href="/user/'+req.user.id+'">'+
        '<i class="glyphicon glyphicon-user"></i> '+
        req.__('user.profile.view') +
      '</a></li>';
      html += '<li><a href="/user/'+req.user.id+'/edit">'+
        '<i class="glyphicon glyphicon-pencil text-primary"></i> '+
        req.__('user.profile.edit') +
      '</a></li>';
      html += '<li class="divider"></li>'+
      '<li><a href="/auth/change-password">'+
        '<i class="glyphicon glyphicon-lock text-warning"></i> '+
        req.__('auth.change-password') +
      '</a></li>';

      we.events.emit('we:render:user:menu:authenticated', {
        html: html, we: we, context: this
      });

      html += '<li class="divider"></li>'+
      '<li><a href="/auth/logout">'+
        '<i class="glyphicon glyphicon-log-out text-danger"></i> Logout'+
      '</a></li></ul></li>';
    } else {

      html+= '<li><a href="/login">'+req.__('Login')+'</a></li>';

      we.events.emit('we:render:user:menu:unAuthenticated', {
        html: html, we: we, context: this
      });

      html+= '<li class="dropdown">'+
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> <span class="caret"></span></a>'+
        '<ul class="dropdown-menu">'+
          '<li><a href="/signup">'+req.__('Register')+'</a></li>'+
        '</ul>'+
      '</li>';
    }

    return new we.hbs.SafeString(html);
  }
}