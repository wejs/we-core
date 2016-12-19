const i18n = require('i18n'),
      moment = require('moment');

var localization = function init (we) {
  i18n.configure (we.config.i18n);

  we.i18n = i18n;

  // set default moment locale
  moment.locale(we.config.i18n.defaultLocale);

  we.events.on('we:after:load:express', function afterLaodExpress(we) {
    // set i18n middleware
    we.express.use(i18n.init);

    we.express.use(function setCurrentUserLocale(req, res, next) {

      // set default, if user will be load in passport it will change the request locale
      req.setLocale(we.config.i18n.defaultLocale);
      // set locale for views
      res.locals.locale = req.getLocale();

      next();
    });
  });
};

module.exports = localization;