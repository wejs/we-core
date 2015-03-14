/**
 * We.js email Class constructor
 */

var emailTemplates = require('email-templates');
var themeEngine = require('../themeEngine');

function EmailTemplate(defaultPath, templateName) {
  this.templatePath = defaultPath;
  this.templateName = templateName;
}

EmailTemplate.prototype.templatePath = '';
EmailTemplate.prototype.templateName = '';

EmailTemplate.prototype.render = function render(templateVariables, cb) {
  var self = this;

  emailTemplates( self.templatePath, function (err, template) {
    if (err) return cb(err, null);

   // render the template
    template( self.templateName, templateVariables, cb);
  });
}

EmailTemplate.prototype.getTemplateFolder = function getTemplateFolder() {
  console.warn('>>themeEngine>>', themeEngine)
}

module.exports = EmailTemplate;