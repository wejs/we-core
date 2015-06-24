/**
 *  Render one template
 *
 * {{{template 'templateHName'}}}
 */

module.exports = function(we) {
  return function rendertemplate(name, options) {
    var theme = options.data.root.theme;
    if (!theme) theme = we.view.themes[we.view.appTheme];

    return we.view.renderTemplate(name, theme, this);
  }
}