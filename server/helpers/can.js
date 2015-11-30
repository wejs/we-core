/**
 * can helper, check if user can do something
 *
  {{#can permission=permissionName roleNames=req.userRoleNames}}
    can
  {{else}}
    cant
  {{/can}}
 */

module.exports = function(we) {
  return function canHelper() {
    var options = arguments[arguments.length-1];

    if (we.acl.canStatic(options.hash.permission, options.hash.roleNames)){
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  }
}