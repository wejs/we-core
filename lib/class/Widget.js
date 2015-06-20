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

Widget.prototype.loadData = function loadData(req, res, next) {
  // TODO
  next();
}

/**
 * Form middleware, use to preload form data
 */
Widget.prototype.formMiddleware = function formMiddleware(req, res, next) {
  next();
};

/**
 * After save middleware
 *
 * override this function in your widget to chage your widget values
 */
Widget.prototype.afterSave = function afterSave(req, res, next) { next(); }

Widget.prototype.getTemplate = function getTemplate(widgetRecord, themeName) {
  if ( view.themes[themeName].widgets[widgetRecord.type]) {
    // first check if this template exits in theme
    var templatePath = view.themes[themeName].widgets[widgetRecord.type];
    return hbs.compile(fs.readFileSync(templatePath, 'utf8'));
  } else{
    return hbs.compile(fs.readFileSync(this.viewTemplatePath, 'utf8'));
  }
}

Widget.prototype.render = function render(widgetRecord, themeName) {
  if (env == 'prod') {
    // firts try to get from cache
    if (this.viewTemplate) return this.viewTemplate(widgetRecord);
  }

  this.viewTemplate = this.getTemplate(widgetRecord, themeName);

  return this.viewTemplate(widgetRecord);
}

Widget.prototype.renderForm = function renderForm(widgetRecord) {
  if (env == 'prod') {
    // firts try to get from cache
    if (this.formTemplate) return this.formTemplate(widgetRecord);
  }

  this.formTemplate = hbs.compile(fs.readFileSync(this.formTemplatePath, 'utf8'));

  return this.formTemplate(widgetRecord);
}

module.exports = Widget;