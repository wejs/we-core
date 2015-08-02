module.exports = function htmlWidget(projectPath, Widget) {
  var widget = new Widget('html', __dirname);

  widget.afterSave = function htmlWidgetafterSave(req, res, next) {
    req.body.configuration = {
      html: req.body.html
    };

    return next();
  };

  return widget;
};