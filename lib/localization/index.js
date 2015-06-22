var i18n = require('i18n');

var localization = function init(we) {
  i18n.configure (we.config.i18n);
  // set i18n middleware
  we.express.use(i18n.init);

  we.i18n = i18n;

  we.events.on('we:after:load:passport', function() {
    we.express.user(function setCurrentUserLocale(req, res, next) {
      if (req.user && req.user.language)
        req.setLocale(req.user.language);

      next();
    })
  });
};

module.exports = localization;