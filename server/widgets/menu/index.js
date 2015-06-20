module.exports = function menuWidget(projectPath, Widget) {
  var widget = new Widget('menu', __dirname);

  widget.afterSave = function afterSave(req, res, next) {
    if (!req.body.configuration) {
      req.body.configuration = {};
    }
    req.body.configuration.menu = req.body.menu;
    return next();
  };

  widget.formMiddleware = function formMiddleware(req, res, next) {
    var we = req.getWe();
    res.locals.menu = we.config.menu;
    next();
  }

  return widget;
};