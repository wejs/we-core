/**
 * Widget wrapper helper
 *
 * usage:  {{#widget-wrapper}} {{/widget-wrapper}}
 */
var hbs = require('hbs');

module.exports = function() {
  return function renderWidgetBlock(record, options) {
    var w = '<widget data-widget-type="'+record.type+
    '" model-widget="'+record.id+'" class="widget widget-'+record.type+'">';

    w += '<widget-header class="widget-header">';
    if (record.title) {
      var bAttrTitle = 'model-widget-'+record.id+'="title"';
      w += '<h3><bind-html '+bAttrTitle+'>'+ record.title +'</bind-html></h3>';
    }

    w += '</widget-header>';
    w += '<widget-content class="widget-content">';
      w += options.fn(this);
    w += '</widget-content>';
    w += '</widget>';

    return new hbs.SafeString(w);
  }
}