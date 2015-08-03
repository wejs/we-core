/**
 * can helper
 *
  {{#can permission=permissionName roles=req.userRoleNames}}
    can
  {{else}}
    cant
  {{/can}}
 */

module.exports = function(we) {
  return function renderWidget() {
    var options = arguments[arguments.length-1];
    var permission = options.hash.permission;
    var roles = options.hash.roleNames;

    if (we.acl.canStatic(permission, roles)){
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  }
}