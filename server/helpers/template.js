/**
 *  Render one template
 *
 * {{{template 'templateHName'}}}
 */

module.exports = function(we) {
  return function rendertemplate(name) {
    var ctx;
    // find context to get theme name
    if (this.theme) {
      ctx = this;
    } else if (this.locals.theme) {
      ctx = this.locals;
    } else {
      we.log.warn('we-core:helper:locals not found');
    }
    var theme = ctx.theme;
    // if not find the theme name get default themes
    if (!theme) theme = we.view.themes[we.view.appTheme];
    // render the template
    return we.view.renderTemplate(name, theme, ctx);
  }
}