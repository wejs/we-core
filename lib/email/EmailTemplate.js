/**
 * We.js email Class constructor
 */

var emailTemplates = require('email-templates');
var fs = require('fs');

function EmailTemplate(defaultPath, templateName) {
  this.templatePath = defaultPath;
  this.templateName = templateName;
}

EmailTemplate.prototype.templatePath = '';
EmailTemplate.prototype.templateName = '';

/**
 * Email template folder cache
 * @type {String}
 */
EmailTemplate.prototype.resolvedTemplateFolder = '';

EmailTemplate.prototype.render = function render(templateVariables, cb) {
  var self = this;
  this.getTemplateFolder(function (err, templateFolder) {
    if (err) return cb(err, null);

    console.log('>>>', templateFolder)

    emailTemplates( templateFolder, function (err, template) {
      if (err) return cb(err, null);

     // render the template
      template( self.templateName, templateVariables, cb);
    });
  })
}

/**
 * Check if email template exists in theme email folder and  if exists override default email template
 *
 * @param  {Function}
 */
EmailTemplate.prototype.getTemplateFolder = function getTemplateFolder(cb) {
  if (this.resolvedTemplateFolder) return cb(null, this.resolvedTemplateFolder); // cache

  var self = this;

  var themeEmailTemplateFolder = process.cwd() + '/server/templates/email';
  fs.readdir(themeEmailTemplateFolder + '/' + this.templateName, function(err, result) {
    if (err) {
      if (err.code != 'ENOENT') {
        return cb(err);
      }
    }

    if (result && result.length) {
      self.resolvedTemplateFolder = themeEmailTemplateFolder
    } else {
      self.resolvedTemplateFolder = self.templatePath;
    }

    return cb(null, self.resolvedTemplateFolder);
  });
}

module.exports = EmailTemplate;