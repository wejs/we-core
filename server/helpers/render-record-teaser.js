/**
 * Render a we.js record teaser
 *
 * usage: {{render-record-teaser modelName='article' record=record locals=locals}}
 */

module.exports = function(we) {
  return function renderRecordTeaser() {
    var options = arguments[arguments.length-1];

    if (
      !options.hash.record ||
      !options.hash.locals ||
      !options.hash.modelName
    ) return '';

    return new we.hbs.SafeString(we.view.renderTemplate(
      options.hash.modelName + '/teaser',
      options.hash.locals.theme,
      {
        modelName: options.hash.modelName,
        record: options.hash.record,
        locals: options.hash.locals
      }
    ));
  }
}