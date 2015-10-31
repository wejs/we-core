module.exports = {
  listFilesRecursive: require('./listFilesRecursive'),
  moment: require('moment'),
  async: require('async'),
  _: require('lodash'),
  mkdirp: require('mkdirp'),
  string: require('string'),
  cookieParser: require('cookie-parser'),
  // core express module
  express: require('express'),
  /**
   * Get redirect url
   * @param  {Object} req express request
   * @param  {[type]} res express response
   * @return {string|null} url or null
   *
   * TODO change to save this services in database
   */
  getRedirectUrl: function getRedirectUrl(req) {
    var we = req.getWe();

    if (req.query) {
      if (req.query.service) {
        if (we.config.services && we.config.services[req.query.service]) {
          we.log.verbose(
            'Service redirect found for service: ', we.config.services[req.query.service]
          );
          return we.config.services[req.query.service].url
        }
      }

      if (req.query.redirectTo) {
        if (!we.router.isAbsoluteUrl(req.query.redirectTo))
          return req.query.redirectTo;
      }
    }

    if (req.body && req.body.redirectTo) {
      if (!we.router.isAbsoluteUrl(req.body.redirectTo))
        return req.body.redirectTo;
    }

    return null;
  }
}