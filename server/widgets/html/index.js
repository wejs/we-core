module.exports = function htmlWidget(projectPath, Widget) {
  var widget = new Widget('html', __dirname);

  return widget;
};