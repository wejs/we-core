/**
 * MainController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var fs = require('fs');
var _ = require('lodash');
var converter = require('sails-emberjs-model-converter');
var staticEmberModels;

module.exports = {
  /**
   * Client side configs
   * @param  {object} req
   * @param  {object} res
   */
  getConfigsJS: function (req, res) {
    var configs = {};
    var sails = req._sails;

    // set header to never cache this response
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    configs.version = '1';
    configs.server = {};
    configs.client = {};
    configs.client.publicVars = {};
    configs.user = {};
    configs.authenticatedUser = {};

    configs.server.providers = sails.config.wejs.providers;

    // get log config
    configs.client.log = sails.config.clientside.log;

    // get public vars
    if(sails.config.clientside.publicVars) {
      // clone it to dont change global variable
      configs.client.publicVars = _.clone(sails.config.clientside.publicVars);
    }

    configs.client.language = sails.config.i18n.defaultLocale;

    if (sails.config.auth) {
       configs.client.isProvider = sails.config.auth.isProvider;
       configs.client.isConsumer = sails.config.auth.isConsumer;
    }

    if(!req.isAuthenticated()){
      // send not logged in configs
      return res.send(configs);
    }

    // set current session user auth token and userId
    if( req.session.authToken ) {
      configs.client.publicVars.authToken = req.session.authToken;
      configs.client.publicVars.userId = req.session.userId;
    }

    res.send(configs);
  },

  getTranslations: function (req, res) {
    var localeParam = req.param('locale');
    var locale;

    if (localeParam) {
      // check if the locale are in avaible we.js locales
      // TODO add suport to search in subprojects
      for (var i = sails.config.i18n.locales.length - 1; i >= 0; i--) {
        if(sails.config.i18n.locales[i] === localeParam){
          locale = localeParam;
        }
      }
    }

    if(req.isAuthenticated()){
      locale = req.user.language;
    }

    if(!locale){
      locale = sails.config.i18n.defaultLocale;
    }

    var translationResponse = '';

    translationResponse += 'if(typeof Ember === "undefined"){' +
      'Ember = {};' +
      'Ember.I18n = {};' +
    '}\n';

    translationResponse += 'if(!Ember.I18n.translations){' +
      'Ember.I18n.translations = {};' +
    '}\n';


    getTranslationFilePath(locale , function(path){
      if (path) {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) {
            sails.log.error('Error: ' + err);
            return res.serverError();
          }

          translationResponse += 'Ember.I18n.translations = ';
          translationResponse+= data;
          translationResponse += ';';

          res.contentType('application/javascript');
          res.send(200, translationResponse );
        });
      } else {
        sails.log.debug('getTranslations:Locale not found:', locale, localeParam);
        res.contentType('application/javascript');
        res.send(200, translationResponse );
      }

    });

  },

  /**
   * Get all sails models converted to ember.js model
   *
   * TODO check if user is admin
   */
  getAllModelsAsEmberModel: function(req, res) {
    var sails = req._sails;

    // cache it in a static variable
    if ( !staticEmberModels) {
      staticEmberModels = converter.convertMultipleToEmberJSFile(sails.models)
    }

    res.set('Content-Type', 'application/javascript');

    res.send(staticEmberModels);
  }
};

function getTranslationFilePath (locale, callback) {
  var localePath = null;
  // check if exists in project
  localePath = sails.config.appPath + '/config/locales/' + locale + '.json';
  fs.exists(localePath, function (exists) {
    if(exists){
      return callback(localePath);
    }

    // if dont have in project use we.js default translations
    localePath = sails.config.appPath + '/node_modules/we-plugin-core/config/locales/' + locale + '.json';
    fs.exists(localePath, function (exists) {
      if(exists){
        return callback(localePath);
      }
      sails.log.info('Localization not found in project or sub-project for', locale);
      callback();
    });
  });
}

