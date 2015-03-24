/**
 * We.js email sender
 */

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var log = require('../log')();
var env = require('../env');

var email = {};
// email template class
email.EmailTemplate = require('./EmailTemplate');

email.templates = {};

// default transporter to send emails
email.transporter = null;

email.mailOptions = null;

email.init = function init(we) {

  email.mailOptions = we.config.email.mailOptions;

  // create reusable transporter object using SMTP transport
  email.transporter = nodemailer.createTransport( smtpTransport(we.config.email) );
}

email.sendEmail = function sendEmail(templateName, options, templateVariables, cb) {
  var emailTemplate = email.templates[templateName];
  if (!emailTemplate) return cb('Email template not found:', templateName);

  if (options.email && !options.to) options.to = options.email;
  if (!options.from) options.from = email.mailOptions.from;
  if (!options.subject) options.subject = email.mailOptions.subject;

  emailTemplate.render(templateVariables, function(err, html, text) {
    if (err) return cb(err);

    options.html = html;
    options.text = text;

    if (env == 'test' || options.testEmail) {
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

module.exports = email;