/** Copyright 2014, Alberto Souza
*
* Licensed under the MIT license:
* http://www.opensource.org/licenses/MIT
*/

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

