module.exports = function htmlWidget(projectPath, Widget) {
  var widget = new Widget('html', __dirname);

  widget.afterSave = function htmlWidgetafterSave(req, res, next) {
    if (!req.body.configuration) {
      req.body.configuration = {};
    }
    req.body.configuration.html = req.body.html;
    return next();
  };

  return widget;
};