/**
 * Layout helper
 *
 * usage:  {{#layout 'name'}} {{/layout}}
 */
module.exports = function(we) {
  return function renderLayout(name, options) {
    if (!options.data.root.regions || !options.data.root.regions[name]) return '';

    var widgetsHtml = '';

    var widget;
    for (var i = 0; i < options.data.root.regions[name].widgets.length; i++) {
      widget = options.data.root.regions[name].widgets[i];
      widgetsHtml += we.view.widgets[widget.type].render(widget, options.data.root.theme);
    }

    return we.view.renderTemplate('region', options.data.root.theme, {
      name: name,
      attrs: options.hash,
      widgets: widgetsHtml
    });
  }
}