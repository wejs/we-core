var i18n = require('i18n');

var localization = function init(we) {
  i18n.configure ( we.config.i18n );
  // set i18n middleware
  we.express.use(i18n.init);

  we.i18n = i18n;
};

module.exports = localization;