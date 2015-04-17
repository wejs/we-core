/**
 * Test config file
 */

module.exports = {
  port: 9800,
  hostname: 'http://localhost:9800',
  appName: 'We test',
  passport: {
    accessTokenTime: 300000000,
    cookieDomain: null,
    cookieName: 'weoauth',
    cookieSecure: false
  },

  database: {
    test: {
      dialect: 'mysql',
      database: 'test',
      username: 'root',
      password: ''
    }
  }
}