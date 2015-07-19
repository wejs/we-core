/**
 * Model action create btn
 *
 * {{we-action-create-btn modelName [params...] req}}
 *
 */
var _ = require('lodash');

module.exports = function(we) {
  return function renderWidget(modelName, req) {
    var roles = _.clone(req.userRoleNames);

    if (we.acl.canStatic('create_' + modelName, roles)) {
      var params = [];
      for (var i = 2; i < arguments.length-1; i++) {
        params.push(arguments[i]);
      }

      return new we.hbs.SafeString(we.view.renderTemplate('model/create-btn', req.res.locals.theme, {
        url: we.router.urlTo(modelName + '.create', params),
        text: req.__('Create')
      }));
    } else {
      return '';
    }
  }
}