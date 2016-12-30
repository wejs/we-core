const session = require('express-session');

module.exports = function(we, weExpress) {
  // - default session storage
  // To change the  session store change the we.config.session.store
  // To disable session set we.config.session to null
  if (we.config.session && !we.config.session.store && we.db.activeConnectionConfig.dialect == 'mysql') {
    let SessionStore = require('express-mysql-session');
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

  if (we.config.session) {
    // save the instance for reuse in plugins
    we.sessionStore = we.config.session.store;
    we.session = session(we.config.session);

    weExpress.use(we.session);
  }
};