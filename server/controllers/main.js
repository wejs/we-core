/**
 * MainController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var fs = require('fs');
var _ = require('lodash');
var converter = require('../../lib/database/converter');
var staticModels;

module.exports = {
  _config: {
    acl: false
  },

  /**
   * Index page route /
   */
  index: function(req, res) {
    var we = req.getWe();
    var context = res.locals;

    we.log.info('rodou o main.index', context);

    res.locals.template = 'home/index';

    res.view({ title: 'Express' });
  },

  /**
   * Client side configs
   * @param  {object} req
   * @param  {object} res
   */
  getConfigsJS: function(req, res) {
    var configs = {};
    var we = req.getWe();

    // set header to never cache this response
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    configs.version = '2';

    configs.env = we.env;
    configs.server = {};
    configs.client = {};
    configs.client.publicVars = {};
    configs.user = {};
    configs.authenticatedUser = {};

    // configs.server.providers = sails.config.wejs.providers;

    // get log config
    configs.client.log = we.config.clientside.log;

    // get public vars
    if (we.config.clientside.publicVars) {
      // clone it to dont change global variable
      configs.client.publicVars = _.clone(we.config.clientside.publicVars);
    }

    configs.client.language = we.config.i18n.defaultLocale;

    if (we.config.auth) {
       configs.client.isProvider = we.config.auth.isProvider;
       configs.client.isConsumer = we.config.auth.isConsumer;
    }

    if (!req.isAuthenticated()) {
      // send not logged in configs
      return res.send(configs);
    }

    // set current session user auth token and userId
    if (req.session.authToken ) {
      configs.client.publicVars.authToken = req.session.authToken;
      configs.client.publicVars.userId = req.session.userId;
    }

    res.send(configs);
  },

  getTranslations: function (req, res) {
    var we = req.getWe();
    var localeParam = req.params.locale;
    var locale;

    if (localeParam) {
      // check if the locale are in avaible we.js locales
      // TODO add suport to search in subprojects
      for (var i = we.config.i18n.locales.length - 1; i >= 0; i--) {
        if ( we.config.i18n.locales[i] === localeParam ) {
          locale = localeParam;
        }
      }
    }

    // TODO change to use res.locals.locale
    if ( req.isAuthenticated()) {
      locale = req.user.language;
    }

    if (!locale) {
      locale = we.config.i18n.defaultLocale;
    }

    var translationResponse = '';

    translationResponse += 'if(typeof Ember === "undefined"){' +
      'Ember = {};' +
      'Ember.I18n = {};' +
    '}\n';

    translationResponse += 'if(!Ember.I18n.translations){' +
      'Ember.I18n.translations = {};' +
    '}\n';

    getTranslationFilePath(we, locale , function (path) {
      if (path) {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) {
            we.log.error('Error: ' + err);
            return res.serverError();
          }

          translationResponse += 'Ember.I18n.translations = ';
          translationResponse+= data;
          translationResponse += ';';

          res.contentType('application/javascript');
          res.send(200, translationResponse );
        });
      } else {
        we.log.debug('getTranslations:Locale not found:', locale, localeParam);
        res.contentType('application/javascript');
        res.ok( translationResponse );
      }

    });

  },

  /**
   * Get all sails models converted to ember.js model
   *
   * TODO check if user is admin
   */
  getAllModelsAsEmberModel: function(req, res) {
    var we = req.getWe();

    // cache it in a static variable
    if ( !staticModels) {
      staticModels = converter.convertMultipleToEmberJSFile( we.db.modelsConfigs );
    }

    res.set('Content-Type', 'application/javascript');

    res.send(staticModels);
  }
};

/**
 * Search for one locale file folder
 *
 * @param  {Object}   we       we.js
 * @param  {String}   locale   locale to search for
 * @param  {Function} callback
 */
function getTranslationFilePath (we, locale, callback) {
  var localePath = null;
  // check if exists in project
  localePath = we.config.appPath + '/config/locales/' + locale + '.json';
  fs.exists (localePath, function (exists) {
    if (exists) {
      return callback(localePath);
    }

    // if dont have in project use we.js default translations
    localePath = we.config.appPath + '/node_modules/we-plugin-core/config/locales/' + locale + '.json';
    fs.exists(localePath, function (exists) {
      if(exists){
        return callback(localePath);
      }
      we.log.info('Localization not found in project or sub-project for', locale);
      callback();
    });
  });
}

