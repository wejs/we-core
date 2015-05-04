var session = require('express-session');
var SessionStore = require('express-mysql-session');

module.exports = function(we, weExpress) {
  // - session storage
  if (!we.config.session.store) {
    we.config.session.store = new SessionStore({
      host: we.db.activeConnectionConfig.host || 'localhost',
      port: we.db.activeConnectionConfig.port || 3306,
      user: we.db.activeConnectionConfig.username,
      password: we.db.activeConnectionConfig.password,
      database: we.db.activeConnectionConfig.database
    });
    we.config.session.resave = true;
    we.config.session.saveUninitialized = true;
  }
  if (we.config.session) weExpress.use(session( we.config.session ));
}