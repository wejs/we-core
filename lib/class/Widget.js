/**
 * We.js widget class
 */

var fs = require('fs');
var view = require('../view');
var hbs = require('hbs');
var env = require('../env');

/**
 * Constructor
 */
function Widget(type, widgetFolder) {
  this.attributes = {};

  this.type = type;
  this.template = type + '/view';

  this.formTemplatePath = widgetFolder + '/form.hbs';
  this.viewTemplatePath = widgetFolder + '/view.hbs';

  this.clientscript = widgetFolder +'/client-script.js';

  this.formTemplate = null;
  this.viewTemplate = null;
}

/**
 * Check if this widget is avaible for selection in current page
 *
 * @param  {[type]}  req express.js request
 * @param  {[type]}  res express.js response
 * @return {Boolean}
 */
Widget.prototype.isAvaibleForSelection = function isAvaibleForSelection() {
  return true;
}

/**
 * View middleware, use for set widget variables
 *
 * @param  {Object}   widget  Widget record
 * @param  {Object}   req    express.js request
 * @param  {Object}   res    express.js response
 * @param  {Function} next   callback
 */
Widget.prototype.viewMiddleware = function viewMiddleware(widget, req, res, next) {
  next();
}

/**
 * Form middleware, use to preload form data
 */
Widget.prototype.formMiddleware = function formMiddleware(req, res, next) {
  next();
};

/**
 * beforeSave save middleware
 *
 * override this function in your widget to chage your widget values before save
 */
Widget.prototype.beforeSave = function beforeSaveSave(req, res, next) { next(); }
Widget.prototype.afterSave = function afterSave(req, res, next) {
  console.log('DEPRECATED! change widget.afterSave to widget.beforeSave');
  this.beforeSave(req, res, next);
}

Widget.prototype.getTemplate = function getTemplate(ctx, themeName) {
  if (view.themes[themeName] && view.themes[themeName].widgets[ctx.widget.type]) {
    // first check if this template exits in theme
    var templatePath = view.themes[themeName].widgets[ctx.widget.type];
    return hbs.compile(fs.readFileSync(templatePath, 'utf8'));
  } else {
    return hbs.compile(fs.readFileSync(this.viewTemplatePath, 'utf8'));
  }
}

Widget.prototype.render = function render(widgetRecord, themeName) {
  if ( !(env == 'prod' && this.viewTemplate) ) {
    // set cache if
    this.viewTemplate = this.getTemplate(widgetRecord, themeName);
  }

  return view.renderTemplate('widget', themeName, {
    attrTitle: 'model-widget-'+widgetRecord.widget.id+'="title"',
    record: widgetRecord.widget,
    locals: widgetRecord.locals,
    widgetContent: this.viewTemplate(widgetRecord)
  });
}

Widget.prototype.renderForm = function renderForm(widgetRecord) {
  if (env == 'prod') {
    // firts try to get from cache
    if (this.formTemplate) return this.formTemplate(widgetRecord);
  }

  this.formTemplate = hbs.compile(fs.readFileSync(this.formTemplatePath, 'utf8'));

  return this.formTemplate(widgetRecord);
}

Widget.prototype.rederContextField = function rederContextField(widget, context,req, res) {
  // context field
  if (context) {
    return '<hr><div class="form-group">' +
      '<strong>'+res.locals.__('widget.context')+':</strong> '+
      context+
    '</div>';
  } else {
    return '';
  }
}

Widget.prototype.renderVisibilityField = function renderVisibilityField(widget, context, req, res) {
  var field = '';
  // set selected attr
  var vrq = {
    'in-portal': '',
    'in-context': '',
    'in-session': '',
    'in-session-record': '',
    'in-page': '',
  };

  if (widget && widget.visibility) {
    vrq[widget.visibility] = ' selected="selected" ';
  }

  // visibility field
  field += '<div class="form-group"><div class="row">' +
    '<label class="col-sm-4 control-label">'+
    res.locals.__('widget.visibility') + '</label>'+
  '<div class="col-sm-8"><select name="visibility" class="form-control">';

  if (context) {
    field +=
    '<option value="in-context"'+vrq['in-context']+'>'+
      res.locals.__('widget.in-context')+
    '</option>';
  } else {
    field +=
    '<option value="in-portal"'+vrq['in-portal']+'>'+
      res.locals.__('widget.in-portal')+
    '</option>';
  }

  field +=
    '<option value="in-session"'+vrq['in-session']+'>'
      +res.locals.__('widget.in-session')+
    '</option>'+
    // - in-session-record
    '<option value="in-session-record"'+vrq['in-session-record']+'>'+
      res.locals.__('widget.in-session-record')+
    '</option>'+
    // - in-page
    '<option value="in-page"'+vrq['in-page']+'>'+
      res.locals.__('widget.in-page')+
    '</option>'+

  '</select></div></div>'+
  '</div><hr>';

  return field;
}

module.exports = Widget;