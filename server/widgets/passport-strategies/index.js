/**
 * Widget passport-strategies main file
 *
 * See https://github.com/wejs/we-core/blob/master/lib/class/Widget.js for all Widget prototype functions
 */

module.exports = function passportStrategiesWidget(projectPath, Widget) {
  var widget = new Widget('passportStrategies', __dirname);

  widget.viewMiddleware = function viewMiddleware(widget, req, res, next) {
    if (!req.we.config.passport) return next();
    // skip if area authenticated
    if (
      !req.isAuthenticated() ||
      (
        req.isAuthenticated() &&
        req.we.acl.canStatic('manage_widget', req.userRoleNames)
      )
    ) {
      widget.strategies = req.we.config.passport.strategies;
      next();
    } else {
      widget.hide = true;
      next();
    }
  }

  return widget;
};