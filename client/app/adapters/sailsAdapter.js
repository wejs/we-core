/**
 *  Load sailsJs adapter and custom JSONSerializer
 *
 */

// add getMetaData function on model
DS.Model.reopen({
  getMetaData: function () {
    return this.get('_data.meta');
  }
});

/**
 * Add Accept in all request
 *
 */
$.ajaxPrefilter(function( options ) {
  if ( !options.beforeSend) {
    options.beforeSend = function (xhr) {
      xhr.setRequestHeader('Accept', 'application/json');
    }
  }
});
App.ApplicationRESTAdapter = DS.SailsRESTAdapter.extend({
  defaultSerializer: '-default',
  pathForType: function(type) {
    var camelized = Ember.String.camelize(type);
    return Ember.String.singularize(camelized);
  }
});

App.ApplicationSocketAdapter = DS.SailsSocketAdapter.extend({

  defaultSerializer: '-default',
  listeningModels: {},
  modelsToListen: [
    'post','activity','comment',
    'message','notification','contact',
    'relato', 'relatoresposta', 'relatopergunta'
  ],
  init: function () {

    this._super();
    var _this = this;
    var store = this.container.lookup('store:main');

    if(this.useCSRF) {
      window.io.socket.get('/csrfToken', function response(tokenObject) {
        this.CSRFToken = tokenObject._csrf;
      }.bind(this));
    }

    var models = this.get('modelsToListen');

    models.forEach(function(model){
      _this._listenToSocket(model);
    });

    window.io.socket.on('notification:allRead', function(){
      //console.warn('RODO!');
      var markedCount = 0;
      // if success all notifications are set to read then ...
      // get all notifications from store
      var notifications = store.all('notification');
      notifications.forEach(function (notification) {
        // if not read set it as read in store
        if ( !notification.get('read') )  {
          store.update('notification',{
            id: notification.id,
            notified: true,
            read: true
          });
          markedCount++;
        }
      });

      if (markedCount) {
        // update notification count
        App.WeNotification.updateCount(true, markedCount);
      }
    });
  },

  pathForType: function(type) {
     var camelized = Ember.String.camelize(type);
     return Ember.String.singularize(camelized);
  },

  isErrorObject: function(data) {
    if(data.data || data.id) return false;

    if(data.status && data.status != 200) return true;

    if(data.statusCode) return true;

    return !!(data.error && data.model && data.summary && data.status);
  },

  socket: function(url, method, data ) {
    var isErrorObject = this.isErrorObject.bind(this);
    method = method.toLowerCase();
    var adapter = this;
    adapter._log(method, url, data);
    if(method !== 'get'){
      this.checkCSRF(data);
    }

    // for we-oauth2 socket.io suport
    // this access_token param will be get from params in oauth 2 middleware
    if(App.get('auth.isAuthenticated')) {
      if(!data) data = {};
      App.auth.setTokenOnData(data);
    }

    return new Ember.RSVP.Promise(function(resolve, reject) {
      window.io.socket[method](url, data, function (data) {
        //console.warn('data get from socket >',url,data);
        if (isErrorObject(data)) {
          adapter._log('error:', data);
          if (data.errors) {
            reject(new DS.InvalidError(adapter.formatError(data)));
          } else {
            reject(data);
          }
        } else {
          resolve(data);
        }
      });
    });
  },

  /**
   * Listen to default sails.js pubsub methods
   * @return {[type]} [description]
   */
  _listenToSocket: function(model) {
    if(model in this.listeningModels) {
      return;
    }
    // var self = this;
    var store = this.container.lookup('store:main');
    var socketModel = model;

    function pushMessage(message) {

      var type = store.modelFor(socketModel);

      var serializer = store.serializerFor(type);
      // Messages from 'created' don't seem to be wrapped correctly,
      // however messages from 'updated' are, so need to double check here.
      if(!(model in message.data)) {
        var obj = {};
        obj[model] = message.data;
        //message.data = obj;
      }

      // check if it are in store
      if ( store.hasRecordForId(type, obj[model].id) ) {
        var oldRecord = store.getById(type, message.id);
        if (oldRecord.get('updatedAt')) {
          if (oldRecord.get('updatedAt') ===  message.data.updatedAt) {
            // skip if updated data from record on store is same as new record
            return;
          }
        }
      }

      var record = serializer.extractSingle(store, type, obj);
      store.push(socketModel, record);
    }

    /**
     * Update one record attribute in store
     *
     * @param  {object} message we.js socket.io updateAttribute pubsub message
     */
    function updateAttribute(message) {
      if (!message.id) {
        return Ember.Logger.error('Invalid message for attributeUpdate pubsub', message);
      }

      var type = store.modelFor(socketModel);

      // check if it are in store
      if ( !store.hasRecordForId(type, message.id) ) {
        // do nothing if dont have this record in store
        return;
      }

      var record = store.getById(type, message.id);

      // new value is empty
      if (!message.data.value) {
        return record.set(message.data.attribute, null);
      }

      var fieldConfig = type.metaForProperty(message.data.attribute);
      if (fieldConfig.kind === 'belongsTo' ) {
        return store.find(fieldConfig.type, message.data.value).then(function(ir) {
          return record.set(message.data.attribute, ir);
        });
      } else if(fieldConfig.kind === 'hasMany') {
        return Ember.Logger.error('Save attribute dont has suport to save hasMany fields');
      } else {
        // only update if value is diferente from store value
        if ( record.get(message.data.attribute) != message.data.value) {
          record.set(message.data.attribute, message.data.value);
        }
      }

    }

    function handleAddedTo(message) {
      if (!message.id) {
        return Ember.Logger.error('Invalid message for attributeUpdate pubsub', message);
      }

      var type = store.modelFor(socketModel);

      // check if it are in store
      // do nothing if dont have this record in store
      if ( !store.hasRecordForId(type, message.id) ) return;

      var relatedType = type.typeForRelationship(message.attribute);
      if (!relatedType) return;
      var record = store.getById(type, message.id);
      var atribute = record.get(message.attribute);

      var inverse = type.inverseFor(message.attribute);

      var inverseRecord;

      if ( store.hasRecordForId(relatedType, message.addedId) ) {
        inverseRecord = store.getById(relatedType, message.addedId);

        if(!atribute.findBy('id', String(inverseRecord.id)) ) {
          atribute.pushObject(inverseRecord);
        }

        if ( inverse ) {
          if ( inverse.kind == 'belongsTo') {
            inverseRecord.set(inverse.name, record);
          } else  if (inverse.kind == 'hasMany') {
            inverseRecord.get(inverse.name).pushObject(record);
          }
          store.push(relatedType, inverseRecord);
        }
      } else {
        store.find(relatedType, message.addedId).then(function(inverseRecord) {
          if(!atribute.findBy('id', String(inverseRecord.id)) ) {
            atribute.pushObject(inverseRecord);
          }
        })
      }
    }

    function handleRemovedFrom(message) {
      if (!message.id) {
        return Ember.Logger.error('Invalid message for attributeUpdate pubsub', message);
      }

      var type = store.modelFor(socketModel);

      // check if it are in store
      // do nothing if dont have this record in store
      if ( !store.hasRecordForId(type, message.id) ) return;

      var record = store.getById(type, message.id);

      var atribute = record.get(message.attribute);
      if (!atribute) return;

      var relationedRecord = atribute.findBy('id', String(message.removedId));
      if (!relationedRecord) return;

      // remove from record
      atribute.removeObject(relationedRecord);
      // remove relationship from related record
      var inverse = type.inverseFor(message.attribute);
      if (!inverse) return;
      if ( inverse.kind == 'belongsTo') {
        relationedRecord.set(inverse.name, null);
      } else  if (inverse.kind == 'hasMany') {
        relationedRecord.get(inverse.name).removeObject(record);
      }
    }

    function destroy(message) {
      var type = store.modelFor(socketModel);
      var record = store.getById(type, message.id);
      if ( record && typeof record.get('dirtyType') === 'undefined' ) {
        record.unloadRecord();
      }
    }

    var eventName = Ember.String.camelize(model).toLowerCase();
    window.io.socket.on(eventName, function (message) {

      if (message.verb) {
        we.events.trigger('sails:'+message.verb+':'+eventName , message);
      }

      // Left here to help further debugging.
      //console.log('Got message on Socket : ', message, message.data);
      if (message.verb === 'created') {
        // Run later to prevent creating duplicate records when calling store.createRecord
        Ember.run.later(null, pushMessage, message, 50);

      }
      if (message.verb === 'updated') {
        message.data.id = message.id;
        return pushMessage(message);
      }

      if (message.verb === 'destroyed' || message.verb === 'deleted') {
        return destroy(message);
      }

      if (message.verb === 'addedTo') {
        return handleAddedTo(message);
        // send one event with added record
        return we.events.trigger('sails:addedTo:'+eventName+':'+message.id , message);
      }

      if (message.verb === 'removedFrom') {
        return handleRemovedFrom(message);
      }

      if (message.verb === 'attributeUpdated') {
        return updateAttribute(message);
      }
    });

    // We add an emtpy property instead of using an array
    // ao we can utilize the 'in' keyword in first test in this function.
    this.listeningModels[model] = 0;
  }
});

App.ApplicationAdapter = App.ApplicationRESTAdapter;


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