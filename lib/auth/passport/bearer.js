var passport = require('passport');
var BearerStrategy = require('we-passport-http-bearer').Strategy;

module.exports = function init(we) {
  passport.use(new BearerStrategy( we.auth.tokenStrategy.bind({we: we} )));
  we.express.use(we.auth.tokenMiddleware)
}