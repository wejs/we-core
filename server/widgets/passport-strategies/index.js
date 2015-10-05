/**
 * Widget passport-strategies main file
 *
 * See https://github.com/wejs/we-core/blob/master/lib/class/Widget.js for all Widget prototype functions
 */

module.exports = function passportStrategiesWidget(projectPath, Widget) {
  var widget = new Widget('passportStrategies', __dirname);

  widget.viewMiddleware = function viewMiddleware(widget, req, res, next) {
    if (!req.we.config.passport) return next();

    widget.strategies = req.we.config.passport.strategies;

    next();
  }

  return widget;
};