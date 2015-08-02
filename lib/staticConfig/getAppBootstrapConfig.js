var _ = require('lodash');

/**
 * Get App Bootstrap configs
 *
 * @param  {Object} req express request
 * @return {Object}     configs
 */
module.exports = function getAppBootstrapConfig(we) {

  var configs = {};

  configs.version = '2';

  configs.env = we.env;

  configs.client = {};
  configs.appName = we.config.appName;
  configs.appLogo = we.config.appLogo;
  configs.defaultUserAvatar = we.config.defaultUserAvatar;

  configs.client.publicVars = {};

  // auth configs
  configs.auth = {
    cookieDomain: we.config.passport.cookieDomain,
    cookieName: we.config.passport.cookieName,
    cookieSecure: we.config.passport.cookieSecure,
    accessTokenTime: we.config.passport.accessTokenTime,

    oauth: {
      server: null
    }
  };

  // acl configs
  configs.acl = { disabled: we.config.acl.disabled };
  // set group roles
  configs.groupRoles = we.config.groupRoles;
  // set group permissions
  configs.groupPermissions = we.config.groupPermissions;

  // configs.server.providers = sails.config.wejs.providers;

  // get log config
  configs.client.log = we.config.clientside.log;

  // get public vars
  if (we.config.clientside.publicVars) {
    // clone it to dont change global variable
    configs.client.publicVars = _.clone(we.config.clientside.publicVars);
  }

  configs.locales = we.config.i18n.locales;
  configs.client.language = we.config.i18n.defaultLocale;

  if (we.config.auth) {
     configs.client.isProvider = we.config.auth.isProvider;
     configs.client.isConsumer = we.config.auth.isConsumer;
  }

  configs.structure = {};

  return configs;
}