const i18n = require('./i18n'),
      moment = require('moment');

var localization = function init (we) {
  i18n.configure (we.config.i18n, we);

  we.i18n = i18n;

  // set default moment locale
  moment.locale(we.config.i18n.defaultLocale);

  we.events.on('we:after:load:express', function afterLoadExpress(we) {
    // set i18n middleware
    we.express.use(i18n.init);
  });
};

module.exports = localization;