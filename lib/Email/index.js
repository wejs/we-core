/**
 * We.js email sender
 */

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
var async = require('async');
var fs = require('fs');

var Email = function EmailPrototype(we) {
  this.we = we;

  // email template class
  this.EmailTemplate = require('email-templates-i18n');

  this.templates = {};
  // default transporter to send emails
  this.transporter = null;
  this.mailOptions = null;
}

// init function
Email.prototype.init = function init(we) {
  this.mailOptions = we.config.email.mailOptions;
  // create reusable transporter object using SMTP transport
  this.transporter = nodemailer
    .createTransport( smtpTransport(we.config.email) );
}

/**
 * Send email with template
 *
 * @param  {String}   templateName      Template name
 * @param  {Object}   options           Options for nodemailer
 * @param  {Object}   templateVariables variables to be avaible in template
 * @param  {Function} cb                callback
 */
Email.prototype.sendEmail = function sendEmail(templateName, options, templateVariables, cb) {
  var email = this;

  var emailTemplate = email.templates[templateName];
  if (!emailTemplate) return cb('Email template not found:', templateName);

  // set locale variable in email template
  if (!templateVariables.locale)
    templateVariables.locale = emailTemplate.defaultLocale;

  emailTemplate.render(templateVariables, function afterRenderTPL(err, result) {
    if (err) return cb(err);

    options.html = result.html;
    options.text = result.text;

    // send mail with defined transport object
    email.send(options, cb);
  });
}

/**
 * Send one email
 *
 * @param  {[Object}   options options to use in nodemailer
 * @param  {Function} cb      callback
 */
Email.prototype.send = function send(options, cb) {
  var email = this;

  if (options.email && !options.to) options.to = options.email;
  if (!options.from) options.from = email.mailOptions.from;
  if (!options.subject) options.subject = email.mailOptions.subject;

  if (email.we.env == 'test' || options.testEmail || email.mailOptions.sendToConsole) {
    email.showDebugEmail(options);
    return cb();
  }

  // send mail with defined transport object
  email.transporter.sendMail(options, function afterSend(error, info) {
    if (error) {
      email.we.log.error('Error on send email:', error, options);
      return cb(error, options);
    }

    email.we.log.debug('Email send:', info, options);

    return cb(null, info);
  });
}

/**
 * Show email on terminal - to tests and if dont have a email server configured
 */
Email.prototype.showDebugEmail = function showDebugEmail (options) {
  var log = this.we.log;

  // dont send emails in test enviroment
  log.warn('---- email.showDebugEmail ----');
  log.warn('---- Email options: ----');
  log.info(options);
  log.warn('---- Displaying the html email that would be sent ----');
  log.info('HTML:\n',options.html);
  log.warn('---- Displaying the text email that would be sent ----');
  log.info('text:\n',options.text);
  log.warn('----------------------------- END --------------------------');
};

/**
 * Load all email template folders
 *
 * @param  {Object}   we we.js
 * @param  {Function} cb callback
 */
Email.prototype.loadEmailTemplates = function loadEmailTemplates(we, cb) {
  var templates = {};
  var EmailTemplate = this.EmailTemplate;

  async.parallel([
    // todo add load theme templates

    function loadPluginEmailTemplates(done) {
      try {
        async.each(we.pluginManager.pluginPaths, function(npmModulePath, next) {

          var PMP = path.resolve(npmModulePath, 'server', 'emails');
          return fs.readdir(PMP, function(err, paths) {
            if (err) {
              if (err.code != 'ENOENT') {
                return next(err);
              } else {
                return next();
              }
            }

            for (var i = paths.length - 1; i >= 0; i--) {
              if (fs.statSync(path.resolve(PMP, paths[i])).isDirectory()) {
                templates[paths[i]] = new EmailTemplate(PMP+'/'+paths[i]);
              }
            }

            next();
          });
        }, function (err) {
          return done(err);
        });
      } catch(e) {
        if (e) console.error(e);
        done();
      }
    },
    function loadProjectEmailTemplates(done) {
      var PMP = path.resolve(we.projectPath, 'server', 'emails');
      fs.readdir(PMP, function (err, paths) {
        if (err) {
          if (err.code == 'ENOENT') {
            return done();
          }
          return done(err);
        }

        for (var i = paths.length - 1; i >= 0; i--) {
          if (fs.statSync(path.resolve(PMP, paths[i])).isDirectory()) {
            templates[paths[i]] = new EmailTemplate(PMP +'/'+ paths[i]);
          }
        }

        done();
      });
    }
  ], function (err) {
    return cb(err, templates);
  });
}

module.exports = Email;