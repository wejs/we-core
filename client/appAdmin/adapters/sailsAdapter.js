
/**
 *  Load sailsJs adapter and custom JSONSerializer
 *
 */


(function($, we, Ember, App){

  /* Register 'array' data type */
  DS.ArrayTransform = DS.Transform.extend({
    deserialize: function(serialized) {
      return (Ember.typeOf(serialized) === 'array') ? serialized : [];
    },
    serialize: function(deserialized) {
    var type = Ember.typeOf(deserialized);
      if (type === 'array') {
          return deserialized;
      } else if (type === 'string') {
          return deserialized.split(',').map(function(item) {
              return jQuery.trim(item);
          });
      } else {
          return [];
      }
    }
  });
  App.register('transform:array', DS.ArrayTransform);

  // set current socket for SailsSocketAdapter
  //window.socket = window.io.socket;

  App.ApplicationRESTAdapter = DS.SailsRESTAdapter.extend({
    defaultSerializer: '-default',
    namespace: '',
    pathForType: function(type) {
      var camelized = Ember.String.camelize(type);
      return Ember.String.singularize(camelized);
    }
  });
  App.ApplicationAdapter = App.ApplicationRESTAdapter;

  // App.ApplicationAdapter = DS.SailsSocketAdapter.extend({

  //   defaultSerializer: '-default',
  //   listeningModels: {},
  //   namespace: '/api/v1',
  //   init: function () {

  //     this._super();
  //     var _this = this;
  //     var store = this.container.lookup('store:main');

  //     if(this.useCSRF) {
  //       window.io.socket.get('/csrfToken', function response(tokenObject) {
  //         this.CSRFToken = tokenObject._csrf;
  //       }.bind(this));
  //     }

  //     var models = ['post','activity','comment','message','notification','contact'];

  //     models.forEach(function(model){
  //       _this._listenToSocket(model);
  //     });

  //     window.io.socket.on('notification:allRead', function(){
  //       console.warn('RODO!');
  //       var markedCount = 0;
  //       // if success all notifications are set to read then ...
  //       // get all notifications from store
  //       var notifications = store.all('notification');
  //       notifications.forEach(function (notification) {
  //         // if not read set it as read in store
  //         if ( !notification.get('read') )  {
  //           store.update('notification',{
  //             id: notification.id,
  //             notified: true,
  //             read: true
  //           });
  //           markedCount++;
  //         }
  //       });

  //       if (markedCount) {
  //         // update notification count
  //         App.WeNotification.updateCount(true, markedCount);
  //       }
  //     });
  //   },

  //   pathForType: function(type) {
  //      var camelized = Ember.String.camelize(type);
  //      return Ember.String.singularize(camelized);
  //   },

  //   isErrorObject: function(data) {
  //     if(data.data || data.id) return false;

  //     if(data.status && data.status != 200) return true;

  //     if(data.statusCode) return true;

  //     return !!(data.error && data.model && data.summary && data.status);
  //   },

  //   socket: function(url, method, data ) {
  //     var isErrorObject = this.isErrorObject.bind(this);
  //     method = method.toLowerCase();
  //     var adapter = this;
  //     adapter._log(method, url, data);
  //     if(method !== 'get'){
  //       this.checkCSRF(data);
  //     }

  //     // for we-oauth2 socket.io suport
  //     // this access_token param will be get from params in oauth 2 middleware
  //     if(App.get('auth.isAuthenticated')) {
  //       if(!data) data = {};
  //       App.auth.setTokenOnData(data);
  //     }

  //     return new Ember.RSVP.Promise(function(resolve, reject) {
  //       window.io.socket[method](url, data, function (data) {
  //         console.warn('data get from socket >',url,data);
  //         if (isErrorObject(data)) {
  //           adapter._log('error:', data);
  //           if (data.errors) {
  //             reject(new DS.InvalidError(adapter.formatError(data)));
  //           } else {
  //             reject(data);
  //           }
  //         } else {
  //           resolve(data);
  //         }
  //       });
  //     });
  //   },


  //   /**
  //    * Listen to default sails.js pubsub methods
  //    * @return {[type]} [description]
  //    */
  //   _listenToSocket: function(model) {
  //     if(model in this.listeningModels) {
  //       return;
  //     }
  //     // var self = this;
  //     var store = this.container.lookup('store:main');
  //     var socketModel = model;

  //     // function findModelName(model) {
  //     //   var mappedName = self.modelNameMap[model];
  //     //   return mappedName || model;
  //     // }

  //     function pushMessage(message) {

  //       var type = store.modelFor(socketModel);

  //       var serializer = store.serializerFor(type);
  //       // Messages from 'created' don't seem to be wrapped correctly,
  //       // however messages from 'updated' are, so need to double check here.
  //       if(!(model in message.data)) {
  //         var obj = {};
  //         obj[model] = message.data;
  //         //message.data = obj;
  //       }

  //       var record = serializer.extractSingle(store, type, obj);

  //       store.push(socketModel, record);
  //     }

  //     function destroy(message) {
  //       var type = store.modelFor(socketModel);
  //       var record = store.getById(type, message.id);
  //       if ( record && typeof record.get('dirtyType') === 'undefined' ) {
  //         record.unloadRecord();
  //       }
  //     }

  //     var eventName = Ember.String.camelize(model).toLowerCase();
  //     window.io.socket.on(eventName, function (message) {
  //       if (message.verb) {
  //         we.events.trigger('sails:'+message.verb+':'+eventName , message);
  //       }

  //       // Left here to help further debugging.
  //       console.warn('Got message on Socket : ', message, message.data);
  //       if (message.verb === 'created') {
  //         // Run later to prevent creating duplicate records when calling store.createRecord
  //         Ember.run.later(null, pushMessage, message, 50);

  //       }
  //       if (message.verb === 'updated') {
  //         pushMessage(message);
  //       }

  //       if (message.verb === 'destroyed' || message.verb === 'deleted') {
  //         destroy(message);
  //       }

  //       if (message.verb === 'addedTo') {
  //         // send one event with added record
  //         we.events.trigger('sails:addedTo:'+eventName+':'+message.id , message);
  //       }

  //     });

  //     // We add an emtpy property instead of using an array
  //     // ao we can utilize the 'in' keyword in first test in this function.
  //     this.listeningModels[model] = 0;
  //   }
  // });


  // TODO mode to other file and load as requirejs module
  //App.ApplicationSerializer = DS.JSONSerializer.extend({
  App.ApplicationSerializer = DS.RESTSerializer.extend({
    /*
      @method serializeIntoHash
      @param {Object} hash
      @param {subclass of DS.Model} type
      @param {DS.Model} record
      @param {Object} options
    */
    serializeIntoHash: function(hash, type, record, options) {
      Ember.merge(hash, this.serialize(record, options));
    }
  });

})(jQuery, we, Ember, App);