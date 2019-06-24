/**
 * Session store loader file
 * only load session store modules if session are enabled
 */
module.exports = function sessionStoreLoader(we, weExpress) {
  if (we.config.session) {
    const session = require('express-session');

    // - default session storage
    // To change the  session store change the we.config.session.store
    // To disable session set we.config.session to null
    if (we.config.session && !we.config.session.store && we.db.activeConnectionConfig.dialect == 'mysql') {
      const c = we.db.defaultConnection.connectionManager.config;

      let SessionStore = require('express-mysql-session');
      we.config.session.store = new SessionStore({
        host: c.host || 'localhost',
        port: c.port || 3306,
        user: c.username,
        password: c.password,
        database: c.database
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
  }

};