/**
 * We.js email sender
 */

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
var async = require('async');
var fs = require('fs');
var EmailTemplate = require('./EmailTemplate.js');
var log = require('../log')();
var env = require('../env');

var email = {
  // email template class
  EmailTemplate: require('./EmailTemplate'),
  templates: {},
  // default transporter to send emails
  transporter: null,
  mailOptions: null,
  // init function
  init: function init(we) {
    email.mailOptions = we.config.email.mailOptions;
    // create reusable transporter object using SMTP transport
    email.transporter = nodemailer.createTransport( smtpTransport(we.config.email) );
  }
};

email.sendEmail = function sendEmail(templateName, options, templateVariables, cb) {

  var emailTemplate = email.templates[templateName];
  if (!emailTemplate) return cb('Email template not found:', templateName);

  if (options.email && !options.to) options.to = options.email;
  if (!options.from) options.from = email.mailOptions.from;
  if (!options.subject) options.subject = email.mailOptions.subject;

  // set locale variable in email template
  if (!templateVariables.locale)
    templateVariables.locale = emailTemplate.defaultLocale;

  emailTemplate.render(templateVariables, function(err, html, text) {
    if (err) return cb(err);

    options.html = html;
    options.text = text;

    if (env == 'test' || options.testEmail || email.mailOptions.sendToConsole) {
      email.showDebugEmail(options);
      return cb();
    }

    // send mail with defined transport object
    email.transporter.sendMail(options, function (error, info) {
      if (error) {
        log.error('Error on send email:', error, options);
        return cb(error, options);
      }

      log.debug('Email send:', info, options);

      return cb(null, info);
    });
  });
}

/**
 * Show email on terminal - to tests and if dont have a email server configured
 */
email.showDebugEmail = function showDebugEmail (options) {
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
email.loadEmailTemplates = function loadEmailTemplates(we, cb) {
  var templates = {};

  async.parallel([
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
              templates[paths[i]] = new EmailTemplate(PMP, paths[i]);
            }
            return next();
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
          if (err.code != 'ENOENT') {
            return done(err);
          } else {
            return done()
          }
        }
        for (var i = paths.length - 1; i >= 0; i--) {
          templates[paths[i]] = new EmailTemplate(PMP, paths[i]);
        }
        done();
      });
    }
  ], function (err) {
    return cb(err, templates);
  });
}

module.exports = email;