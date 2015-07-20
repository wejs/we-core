/**
 * We.js user menu helper
 *
 * render user menu
 *
 * usage:  {{#we-user-menu 'manuName'}} {{/we-user-menu}}
 */

module.exports = function(we) {
  return function renderWidget() {
    var html =  '';

    if (this.req.isAuthenticated()) {
      html = '<li class="dropdown">'+
        '<a class="dropdown-toggle" data-toggle="dropdown" href="#" aria-expanded="false">'+
          this.req.user.displayName+
          '<span class="caret"></span>'+
        '</a><ul class="dropdown-menu">';

      html += '<li><a href="/user/'+this.req.user.id+'">'+
        '<i class="glyphicon glyphicon-user"></i> '+
        this.req.__('user.profile.view') +
      '</a></li>';
      html += '<li><a href="/user/'+this.req.user.id+'/edit">'+
        '<i class="glyphicon glyphicon-pencil text-primary"></i> '+
        this.req.__('user.profile.edit') +
      '</a></li>';
      html += '<li class="divider"></li>'+
      '<li><a href="/auth/change-password">'+
        '<i class="glyphicon glyphicon-lock text-warning"></i> '+
        this.req.__('auth.change-password') +
      '</a></li>';

      we.events.emit('we:render:user:menu:authenticated', {
        html: html, we: we, context: this
      });

      html += '<li class="divider"></li>'+
      '<li><a href="/auth/logout">'+
        '<i class="glyphicon glyphicon-log-out text-danger"></i> Logout'+
      '</a></li></ul></li>';
    } else {

      html+= '<li><a href="/login">'+this.req.__('Login')+'</a></li>';

      we.events.emit('we:render:user:menu:unAuthenticated', {
        html: html, we: we, context: this
      });

      html+= '<li class="dropdown">'+
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> <span class="caret"></span></a>'+
        '<ul class="dropdown-menu">'+
          '<li><a href="/signup">'+this.req.__('Register')+'</a></li>'+
        '</ul>'+
      '</li>';
    }

    return new we.hbs.SafeString(html);
  }
}


//

//       <ul class="dropdown-menu">
// {{!--         <li>
//           {{#link-to 'user.findOne' req.user.id}}{{t 'Profile'}}{{/link-to}}
//         </li> --}}

//         <li class="divider"></li>
//         <li>{{#link-to 'auth.logout'}}
//           <i class="glyphicon glyphicon-log-out"></i> {{t 'Logout'}}
//         {{/link-to}}</li>
//       </ul>
//     </li>

//   {{else}}
//     <li>{{#link-to 'auth.login'}}{{t "login.block.button.text"}}{{/link-to}}</li>