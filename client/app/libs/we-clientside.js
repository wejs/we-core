  /** Copyright 2014, Alberto Souza
  *
  * Licensed under the MIT license:
  * http://www.opensource.org/licenses/MIT
  */

(function($, window){

  var we = {};

  // change we.events to use sails.js evented
  we.events = Ember.Object.extend(Ember.Evented).create();

  // dinamic config
  we.configs = {};

  // old we config
  we.config = {};

  we.config.serverUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':'+window.location.port: '');
  we.config.system = {};

  // default language
  we.config.language = 'en-us';

  // client side config object
  we.configs.client = {};
  // by default we.js try to get server configs
  we.configs.getConfigsFromServer = true;
  // default configs url
  we.configs.serverConfigUrl = '/configs.js';
  // default log config
  we.configs.client.log = {};
  we.configs.client.log.events = false;
  we.configs.client.log.hooks = false;

  // production or development
  //we.config.system.environment = 'production';
  we.config.system.environment = 'development';

  we.authenticatedUser = {};

  we.audios = {};
  //we.audios.connect = new Audio("../audios/lightsaber.mp3");
  //we.audios.newMessage = new Audio("../audios/tick.mp3");

  // --- HOOKS --- //
  we.hooks = {};
  we.hooks.list = {};

  we.hooks.on = function weAddEventListener(eventName, callback){
    if(!we.hooks.list[eventName]){
      we.hooks.list[eventName] = [];
    }
    we.hooks.list[eventName].push(callback);
  };

  /**
   * Trigger one wejs event ( works like hooks ) and runs all functions added in this event
   * After run one [event]-after-succes or a [event]-after-error event
   *
   * @param  {string}  eventName name of the event to trigger
   * @param  {object}  data      Data to passa for event listeners
   * @param  {Boolean} isAfter   Opcional if is true dont run after events functions
   * @return {null}
   */
  we.hooks.trigger = function weTriggerEvent(eventName, data, isAfter){
    // log it if log is enabled
    if(we.configs.client.log.hooks) console.debug('triggering hook: '+ eventName, isAfter);

    var afterTriggerExecAll = function(err){
      if(!isAfter){
        if(err){
          data.error = err;
          we.hooks.trigger( eventName + "-after-error", data.error, true);
        }else{
          we.hooks.trigger( eventName + "-after-success", data, true);
        }
      }
    };

    // if dont have functions in this event then run the affterTrigger
    if(!we.hooks.list[eventName]){
      return afterTriggerExecAll();
    }

    async.each(we.hooks.list[eventName],
      function(functionToRun, next){
        functionToRun(data, next);
      },
      afterTriggerExecAll
    );
  };

  we.users = {};

  we.getUser = function getUser(id, callback){
    if(we.users[id] && we.users[id].id){
      callback(null, we.users[id]);
    }else{

      we.http.get(
        we.config.serverUrl + '/users/' + id,
        null,
        function(data){
          if(data.item && data.item.id){
            // logged in
            we.users[data.item.id] =  data.item;
            callback(null, we.users[data.item.id]);
          }else{
            // offline
            callback(null, null);
          }
        }
      );
    }
  };

  we.storeUser = function storeUser(user){
    we.users[user.id] = user;
  };

  /**
   * Get current authenticated user from wejs server
   * @param  {Function} callback
   * @return null
   */
  we.getAuthenticatedUser = function getAuthenticatedUser(callback){
    if(we.authenticatedUser && we.authenticatedUser.id){
      return callback(null, we.authenticatedUser);
    }

    we.http.get(
      we.config.serverUrl + '/users/current',
      null,
      function(data){
        if(data.user && data.user.id){
          // logged in
          we.authenticatedUser = data.user;
          callback(null, we.authenticatedUser);

          we.isGettingAuthenticatedUser = false;
          we.hooks.trigger("user-authenticated", {
            'user':  we.authenticatedUser
          });

        }else{
          // offline
          callback(null, null);
        }
      }
    );

  };

  we.isAuthenticated = function isAuthenticated(){
    if(we.authenticatedUser && we.authenticatedUser.id){
      return true;
    }else{
      return false;
    }
  };

  we.notify = function notify(title, msg, onClickFunction, image) {

    if(!window.webkitNotifications){
      return false;
    }

    var havePermission = window.webkitNotifications.checkPermission();
    if (havePermission === 0) {

      // set default icone
      if(!image){
       image = 'images/icon-38.png';
      }

      // 0 is PERMISSION_ALLOWED
      var notification = window.webkitNotifications.createNotification(
        image,
        title,
        msg
      );

      if(onClickFunction){
        notification.onclick = onClickFunction;
      }

      notification.show();
    } else {
      console.log('No permission to use notify resource');
        window.webkitNotifications.requestPermission();
    }
  };

  // -- Plugin suport
  we.plugins = {};

  we.plugins.objects = {};

  // Default plugin load types
  // defines load execution order
  we.plugins.loadTypes = [
    'Core' ,
    'Plugin',
    'Extension'
  ];

  we.plugins.loadTypes.forEach(function(type){
    we.plugins.objects[type] = [];
  });

  we.plugins.register = function(pluginToRegister){
    var loadType = 'Plugin';
    if(pluginToRegister.loadType){
      loadType = pluginToRegister.loadType;
    }

    if(we.plugins.objects[loadType]){
      we.plugins.objects[loadType].push( pluginToRegister );
    }else{
      we.plugins.objects.Plugin.push( pluginToRegister );
    }

  };

  we.plugins.enable = function(pluginName, callback){

    callback();
  };

  we.plugins.disable = function(pluginName, callback){

    callback();
  };

  we.plugins.loadAllEnabledPlugins = function(callback){

    async.each(we.plugins.loadTypes, function(loadType, nextType){

      if(we.plugins.objects[loadType]){
        // TODO get enabled plugins from config
        async.each(we.plugins.objects[loadType], function(plugin, next){
          plugin.enable(we);

          next();
        }, function(error){
          if(error) console.error(error);
          nextType();
        });
      }else{
        nextType();
      }

    }, function(error){
      if(error) console.error(error);

      we.hooks.trigger("we-bootstrap-all-plugins-loaded");

      callback();
    });

  };

  // -- Bootstrap we.js

  we.bootstrap = function bootstrap(configs, callback){
    // if pass callback in first arg
    if(typeof configs === 'function'){
      callback = configs;
      configs = null;
    }else if(typeof callback !== 'function'){
      callback = function(){};
    }

    if(configs){
      // merge configs with we.js default configs
      we.configs = $.extend( we.configs, configs );
    }


    we.hooks.on("we-bootstrap-end-after-success", function(data, next){
      callback();

      next();
    });

    we.hooks.trigger("we-bootstrap-get-configs");
  };

  we.hooks.on("we-bootstrap-get-configs",function(data, next){
    if(we.configs.getConfigsFromServer){
      $.ajax({
        type: 'GET',
        url: we.configs.serverConfigUrl,
        cache: false,
        data: data,
        dataType: 'json',
        contentType: 'application/json',
        success: function(data){
          console.debug('configs', data);

          // server and system configs, Ex.: socket.io server url ...
          we.configs.server = data.server;

          // configs for clientside framework
          we.configs.client = data.client;

          // authenticated user and configs
          if(data.authenticatedUser){
            we.authenticatedUser = data.authenticatedUser;

            if(we.authenticatedUser.language){
              we.config.language = we.authenticatedUser.language;
            }
          }

          // models configs like model fields/ attributes
          we.configs.models = data.models;

          // Plugins configs
          if(data.plugins){
            if(data.plugins.loadTypes){
              we.plugins.loadTypes = data.plugins.loadTypes;
            }
          }
          next();

        },
        error: function(data){
          console.warn('We.js Error on get configs from server', data);
          next();
        }
      });
    }else{
      next();
    }

  });

  we.hooks.on("we-bootstrap-get-configs-after-success",function(data, next){
    console.debug('wejs data loaded');
    // after get data start configure fase
    we.hooks.trigger("we-bootstrap-configure");

    next();
  });

  we.hooks.on("we-bootstrap-configure-after-success",function(data, next){
    console.debug('wejs configured');
    // after get data start configure fase
    we.hooks.trigger("we-bootstrap-plugins-enable");

    next();
  });

  we.hooks.on('we-bootstrap-plugins-enable', function(data, next){
    we.plugins.loadAllEnabledPlugins( function(error){
      if(error) console.error(error);

      // if is in development env load development resources
      // TODO move to one development plugin
      if(we.config.system.environment == 'development'){
        we.loadDevelopementResources();
      }
      next();
    });
  });

  // some default wejs hooks
  we.hooks.on("we-bootstrap-plugins-enable-after-success", function(data, next){
    we.hooks.trigger("we-bootstrap-end");
    next();
  });

  we.hooks.on("we-bootstrap-plugins-enable-after-error", function(data, next){
    console.error('Error on we-bootstrap-plugins-register-after-error: ',data);

    next();
  });


  // DEVELOPMENT
  // TODO move to one developement plugin
  we.plugins.registerDevelopement = function(pluginToRegister){

    if(!we.plugins.objectsDevelopement){
      we.plugins.objectsDevelopement = [];
    }

    var name = pluginToRegister.name;
    console.warn('Loading development plugin: ',name);
    we.plugins.objectsDevelopement.push( pluginToRegister );

  };
  we.plugins.loadAllDevelopmentPlugins = function(callback){

    if(!we.plugins.objectsDevelopement){
      return callback();
    }
    // TODO get enabled plugins from config
    async.each(we.plugins.objectsDevelopement, function(plugin, next){
      plugin.enable(we);

      next();
    }, callback );
  };

  we.loadDevelopementResources = function loadDevelopementResourcesFunc(callback){
    // register events

    we.hooks.on("we-bootstrap-development-plugins-register-after-success", function(data,next){
      we.plugins.loadAllDevelopmentPlugins( function(error){
        if(error) console.error(error);

        we.hooks.trigger("we-development-bootstrap-end");
        next();
      });

    });

    we.hooks.trigger("we-bootstrap-development-plugins-register");


    // load developement resources asynchronously
    if(callback) callback();
  };

  // Utils //
  //
  we.utils = {};

  /**
   * Scroll a element with scroll to bottom
   * For ember js
   * @requires jquery
   * @param {string} seletor Jquery seletor
   * @param {object} self EmberJs view or component element
   *
   * DEPRECATED!
   */
  we.utils.scrollToBottom = function weUtilsScrollToBottom(seletor, self){
    var box;
    if(self){
      box = self.$(seletor);
    }else{
      box = $(seletor);
    }
    setTimeout(function(){
      if(box){
        box.scrollTop(box.prop("scrollHeight"));
      }
    }, 10);
  };

  /**
   * Check if a object is array
   * @param {object} object object to test
   */
  we.utils.isArray = function isArray(object){
    if (object.constructor || object.constructor === Array) return true;
    else return false;
  };

  we.utils.isValidUrl = function isValidUrl(s) {
    return (s.indexOf("http://")>-1 || s.indexOf("https://")>-1);
  };

  we.utils.isVideoUrl = function isValidUrl(url) {
    if(we.utils.parseYouTubeUrl(url)){
      return 'youtube';
    }else if(we.utils.parseVimeoUrl(url) ){
      return 'vimeo';
    }

    return false;
  };


  we.utils.parseVideoUrl = function isValidUrl(url) {
    var id;

    id = we.utils.parseYouTubeUrl(url);
    if(id){
      return {
        provider: 'youtube',
        id: id
      };
    }

    id = we.utils.parseVimeoUrl(url);
    if( id ){
      return {
        provider: 'vimeo',
        id: id
      };
    }

    return false;
  };

  we.utils.parseYouTubeUrl =function parseYouTubeUrl(str) {
    var re = /\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?([a-z0-9_\-]+)/i;
    var matches = re.exec(str);
    if (matches) { return matches[1]; }
    return null;
  };

  we.utils.parseVimeoUrl = function parseVimeoUrl(str) {
    var re = /\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i;
    var matches = re.exec(str);
    if (matches) { return matches[1]; }
    return null;
  };

  we.utils.uniqueIdFunction =  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  };

  we.utils.generateSimpleUniqueId = function() {
    return we.utils.uniqueIdFunction() + we.utils.uniqueIdFunction();
  };

  // -- Ember.js UTILS --
  we.utils.ember = {};

  /**
   *  Check if a emberjs array of object has te value atrib
   */
  we.utils.ember.arrayObjsHas = function(items, attrib, value) {
    if(!items){
      return false;
    }
    for (var i = 0; i < items.length; i++) {
      if(items[i].get(attrib) === value){
        return true;
      }
    }
    return false;
  };

  /**
   * Remove one item in array of objects by object id
   * @param  {array} items       array
   * @param  {string} idValue    id to search for
   * @return {object|bool}       return the removed object or false if the object not is found
   */
  we.utils.ember.arrayRemoveById = function(items, idValue) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === idValue) {
        //remove the item from array and
        //return the value and stop the execution
        return items.splice([i],1);
      }
    }
    // item not found in array
    return false;
  };


  // set we as global
  // TODO make it configurable
  window.we = we;


})(jQuery, window);;/**
 * WE i18n development plugin to show untranslated texts with i18njs
 *
 */

(function($, we){

  var plugin = {};

  plugin.name = 'i18njs-log-untranslated-texts';
  plugin.type = 'development';
  plugin.version = '0.0.1';

  plugin.enable = function(we) {
    i18n = we.i18n;

    i18n.translate = function(text, num, formatting, context, language) {
      var contextData, data, result;
      if (!context) {
        context = this.globalContext;
      }
      if (language) {
        data = i18n.languageData[language];
      }
      if (!data) {
        data = i18n.data;
      }
      if (!data) {
        return i18n.useOriginalText(text, num, formatting);
      }
      contextData = i18n.getContextData(data, context);
      if (contextData) {
        result = i18n.findTranslation(text, num, formatting, contextData.values);
      }
      if (!result) {
        result = i18n.findTranslation(text, num, formatting, data.values);
      }
      if (!result) {
        console.debug('Untranslated text: "'+text+ '"');

        return i18n.useOriginalText(text, num, formatting);
      }
      return result;
    };

  };

  plugin.disable = function(we) {
    console.warn('TODO disable i18n function ...');
  };

  we.plugins.registerDevelopement(plugin);

})(jQuery, we);
;/**
 * WE default client side localizator i18njs
 *
 */

(function($, we){

  var plugin = {};

  plugin.name = 'weI18njs';
  plugin.type = 'i18n';
  plugin.loadType = 'Core';
  plugin.version = '0.0.1';

  plugin.language = {};

  we.i18n = getI18nLib();

  plugin.enable = function(we) {
    we.i18n = getI18nLib();
    we.i18n.add(plugin.language);
  };

  plugin.disable = function() {
    console.warn('TODO disable i18n function ...');
  };

  we.plugins.register(plugin);

  we.hooks.on("we-bootstrap-configure",function(data, next){

    var langUrl = '/langs/'+ we.config.language +'.json';
    //  Load the JSON File
    $.ajax(langUrl).success(function getLanguage(data){
      //  Set the data
      if(data){
        plugin.language = data;
      }else{
        console.warn('No language file found');
      }

      next();

    }).error(function(){
      next();
    });
  });

  function getI18nLib(){
    var i18n = function(text, langNumOrFormatting, numOrFormattingOrContext, formattingOrContext, context) {
      var formatting, lang, num;
      if (context === null) {
        context = this.globalContext;
      }
      if (typeof langNumOrFormatting == "object") {
        lang = null;
        num = null;
        formatting = langNumOrFormatting;
        context = numOrFormattingOrContext || this.globalContext;
      } else {
        if (typeof langNumOrFormatting === "number") {
          lang = null;
          num = langNumOrFormatting;
          formatting = numOrFormattingOrContext;
          context = formattingOrContext || this.globalContext;
        } else {
          lang = langNumOrFormatting;
          if (typeof numOrFormattingOrContext === "number") {
            num = numOrFormattingOrContext;
            formatting = formattingOrContext;
            context = context;
          } else {
            num = null;
            formatting = numOrFormattingOrContext;
            context = formattingOrContext || this.globalContext;
          }
        }
      }
      if (typeof text == "object") {
        if (typeof text.i18n == "object") {
          text = text.i18n;
        }
        return i18n.translateHash(text, context, lang);
      } else {
        return i18n.translate(text, num, formatting, context, lang);
      }
    };

    i18n.globalContext = null;

    i18n.data = null;

    i18n.languageData = null;

    i18n.add = function(d, lang) {
      var c, data, k, v, _i, _len, _ref, _ref1, _results;

      if (lang) {
        if (i18n.languageData[lang] === null) {
          i18n.languageData[lang] = {
            values: {},
            contexts: []
          };
        }
        data = i18n.languageData[lang];
      } else {
        data = i18n.data;
      }
      if ((d.values !== null)) {
        _ref = d.values;
        for (k in _ref) {
          v = _ref[k];
          data.values[k] = v;
        }
      }
      if (d.contexts) {
        _ref1 = d.contexts;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          c = _ref1[_i];
          _results.push(data.contexts.push(c));
        }
        return _results;
      }
    };

    i18n.setContext = function(key, value) {
      i18n.globalContext[key] = value;
      return i18n.globalContext[key];
    };

    i18n.clearContext = function(key) {
      i18n.globalContext[key] = null;
      return i18n.globalContext[key];
    };

    i18n.reset = function() {
      i18n.data = {
        values: {},
        contexts: []
      };
      i18n.globalContext = {};
      i18n.languageData = {};
      return i18n.languageData;
    };

    i18n.resetData = function() {
      i18n.data = {
        values: {},
        contexts: []
      };
      i18n.languageData = {};
      return i18n.languageData;
    };

    i18n.resetContext = function() {
      i18n.globalContext = {};
      return i18n.globalContext;
    };

    i18n.resetLanguage = function(lang) {
      i18n.languageData[lang] = null;
      return i18n.languageData[lang];
    };

    i18n.translateHash = function(hash, context, language) {
      var k, v;
      for (k in hash) {
        v = hash[k];
        if (typeof v === "string") {
          hash[k] = i18n.translate(v, null, null, context, language);
        }
      }
      return hash;
    };

    i18n.translate = function(text, num, formatting, context, language) {
      var contextData, data, result;
      if (!context) {
        context = this.globalContext;
      }
      if (language) {
        data = i18n.languageData[language];
      }
      if (!data) {
        data = i18n.data;
      }
      if (!data) {
        return i18n.useOriginalText(text, num, formatting);
      }
      contextData = i18n.getContextData(data, context);
      if (contextData) {
        result = i18n.findTranslation(text, num, formatting, contextData.values);
      }
      if (!result) {
        result = i18n.findTranslation(text, num, formatting, data.values);
      }
      if (!result) {
        return i18n.useOriginalText(text, num, formatting);
      }
      return result;
    };

    i18n.findTranslation = function(text, num, formatting, data) {
      var result, triple, value, _i, _len;
      value = data[text];
      if (value === null) {
        return null;
      }
      if (num === null) {
        if (typeof value === "string") {
          return i18n.applyFormatting(value, num, formatting);
        }
      } else {
        if (value instanceof Array || value.length) {
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            triple = value[_i];
            if ((num >= triple[0] || triple[0] === null) && (num <= triple[1] || triple[1] === null)) {
              result = i18n.applyFormatting(triple[2].replace("-%n", String(-num)), num, formatting);
              return i18n.applyFormatting(result.replace("%n", String(num)), num, formatting);
            }
          }
        }
      }
      return null;
    };

    i18n.getContextData = function(data, context) {
      var c, equal, key, value, _i, _len, _ref, _ref1;
      if (data.contexts === null) {
        return null;
      }
      _ref = data.contexts;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        equal = true;
        _ref1 = c.matches;
        for (key in _ref1) {
          value = _ref1[key];
          equal = equal && value === context[key];
        }
        if (equal) {
          return c;
        }
      }
      return null;
    };

    i18n.useOriginalText = function(text, num, formatting) {
      if (num === null) {
        return i18n.applyFormatting(text, num, formatting);
      }
      return i18n.applyFormatting(text.replace("%n", String(num)), num, formatting);
    };

    i18n.applyFormatting = function(text, num, formatting) {
      var ind, regex;
      for (ind in formatting) {
        regex = new RegExp("%{" + ind + "}", "g");
        text = text.replace(regex, formatting[ind]);
      }
      return text;
    };

    i18n.reset();

    return i18n;
  }

})(jQuery, we);
/**
 * WE default client side loading progress bar controller
 *
 */

(function($, we){

  var plugin = {};

  plugin.name = 'weSysloadProgress';
  plugin.type = 'Plugin';
  plugin.loadType = 'Core';
  plugin.version = '0.0.1';

  plugin.enable = function(we) {

    var setPercent = function setPercent(percentNumber){
      if(typeof percentNumber !== 'number'){
        console.warn('weSysloadProgress plugin : percent dont are number. percent:',percentNumber);
        return null;
      }

      var loadSiteProgressProgressbar = jQuery('#loadSiteProgressProgressbar');
      var loadSiteProgressProgressbarPercent = jQuery("#loadSiteProgressProgressbarPercent");

      if(loadSiteProgressProgressbar.width){
        loadSiteProgressProgressbar.width(percentNumber+'%');
        loadSiteProgressProgressbar.attr('aria-valuenow', percentNumber);
      }else{
        console.warn('weSysloadProgress plugin : progress bar not found!');
      }

      if(loadSiteProgressProgressbarPercent.html){
        jQuery("#loadSiteProgressProgressbarPercent").html(percentNumber+'%');
      }
    };

    var setProgressText = function setProgressText(text){
      var loadSiteProgressText =  jQuery('#loadSiteProgressText');

      if(loadSiteProgressText.html){
        loadSiteProgressText.html(text);
      }
    };

    jQuery('.we-loading-hide').hide();

    we.hooks.on('we-bootstrap-all-plugins-loaded', function(data, next){
      setPercent(20);
      setProgressText('Loading plugins ...');
      next();
    });


    we.hooks.on('we-bootstrap-development-plugins-register', function(data, next){
      setPercent(30);
      setProgressText('Loading development plugins ...');
      next();
    });

    we.hooks.on('we-development-bootstrap-end', function(data, next){
      setPercent(90);
      setProgressText('Loading ...');

      next();
    });

    we.hooks.on('we-development-bootstrap-end-after-success', function(data, next){
      if(jQuery('#loadSiteProgressBlock')){
        jQuery('#loadSiteProgressBlock').remove();
      }
      if(jQuery('.we-loading-hide').show){
        jQuery('.we-loading-hide').show();
        jQuery('.we-loading-hide').removeClass('we-loading-hide');
      }
      next();
    });

    we.hooks.on('we-development-bootstrap-end-after-error', function(data, next){
      setPercent(100);
      setProgressText('Error loading');

      console.erro('Error loading we.js', data);

      next();
    });

  };

  plugin.disable = function(we) {
    console.warn('TODO disable ...'+ plugin.name);
  };

  // register this plugin in we bootstrap
  we.hooks.on("we-bootstrap-plugins-register", function(data, next){
    // register this plugin in we bootstrap
    we.plugins.register(plugin);

    // if need, do something more in we bootstrap
    // ...

    // always exec next function!
    next();
  });

})(jQuery, we);