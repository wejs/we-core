module.exports = function init(we) {
  if (!we.config.passport.strategies.weOauth2) {
    we.log.warn('weOauth2 passport strategy not found');
    return;
  }

  var weOauth2Middleware;
  // login / logout middleware
  if (we.config.passport.strategies.weOauth2.isProvider) {
    weOauth2Middleware = we.auth.provider.init();
  } else {
    weOauth2Middleware = we.auth.consumer.init();
  }

  we.express.use(weOauth2Middleware);

}