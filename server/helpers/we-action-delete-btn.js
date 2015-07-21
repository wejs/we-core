/**
 * Model action delete btn
 *
 * {{we-action-delete-btn modelName record [params...] req}}
 *
 */
var _ = require('lodash');

module.exports = function(we) {
  return function renderWidget(modelName, record, req) {
    var roles = _.clone(req.userRoleNames);
    var options = arguments[arguments.length-1];
    // if is authenticated, check if are owner
    if (req.isAuthenticated()) {
      if (record.isOwner(req.user.id)) {
        // add owner
        if (roles.indexOf('owner') == -1 ) roles.push('owner');
      } else {
        // remove owner if dont are owner
        if (roles.indexOf('owner') > -1 ) roles.splice( roles.indexOf('owner'));
      }
    }

    if (we.acl.canStatic('delete_' + modelName, roles)) {
      var params = [];
      for (var i = 3; i < arguments.length-1; i++) {
        params.push(arguments[i]);
      }

      var redirectTo = req.url;
      if (options.hash.redirectTo) redirectTo = options.hash.redirectTo;

      return new we.hbs.SafeString(we.view.renderTemplate('model/delete-btn', req.res.locals.theme, {
        url: we.router.urlTo(modelName + '.delete', params)+ '?redirectTo='+ redirectTo,
        text: req.__('Delete')
      }));
    } else {
      return '';
    }
  }
}