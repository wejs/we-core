
window.FollowObject = Ember.Object.create({
  // a index to store flags in model:modelId format
  flagIndex: {},
  saveInCache: function (model, modelId, value) {
    return this.flagIndex[model+'/'+modelId] = value;
  },
  getFromCache: function (model, modelId) {
    return this.flagIndex[model+'/'+modelId];
  },

  isFollowing: function (model, modelId, userId, store) {
    var self = this;
    // check if are on flag cache index to dont make other request on server for this data
    var flagIndex = self.getFromCache(model, modelId);
    if ( flagIndex && flagIndex === 'notFlagged') {
      // this flag result is cached and user dont are flagged
      return new Ember.RSVP.Promise(function(resolve) {
        resolve({});
      });
    }

    var flagOnCache = self.checkInCache(model, modelId, store);
    if( flagOnCache ){
      return new Ember.RSVP.Promise(function(resolve) {
        resolve(flagOnCache)
      });
    }

    return new Ember.RSVP.Promise(function isFollowingPromisse(resolve) {
      Ember.$.ajax({
        type: 'GET',
        url: '/api/v1/follow/'+model+'/'+modelId,
        dataType: 'json',
        contentType: 'application/json'
      }).done(function onSuccess(data){
        if (data.follow && data.follow[0]) {
          // save in index cache
          self.saveInCache(model, modelId, 'flagged');
          // if has store then save it on store after resolves
          if (store) {
            resolve( store.push('follow',data.follow[0]) );
          } else {
            resolve( data.follow[0] );
          }
        } else {
          // save in index cache
          self.saveInCache(model, modelId, 'notFlagged');
          // resolve it
          resolve({});
        }
      }).fail(function onFail(){
        resolve({});
      });
    });
  },

  follow: function (model, modelId, store) {
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      Ember.$.ajax({
        type: 'POST',
        url: '/api/v1/follow/' + model + '/' + modelId,
        dataType: 'json',
        contentType: 'application/json'
      }).done(function(data){
        if (data.follow && data.follow) {
          self.saveInCache(model, modelId, 'flagged');
          resolve( store.push('follow',data.follow) );
        } else {
          resolve({});
        }
      }).fail(reject);
    });
  },

  unFollow: function(model, modelId, flagId, store) {
    var self = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax({
        type: 'DELETE',
        url: '/api/v1/follow/' + model + '/' + modelId
      }).done(function(){
        self.saveInCache(model, modelId, 'notFlagged');
        if ( store.hasRecordForId ('follow', flagId) ) {
          store.find('follow', flagId).then(function(record){
            record.deleteRecord();
          });
        }
        resolve({});
      }).fail(reject);
    });
  },

  /**
   * Check if a flag is on ember data memory cache

   * @return {boolean}         return true or false
   */
  checkInCache: function(model, modelId, store) {
    var localFlags = store.all('follow').content;
    for (var i = localFlags.length - 1; i >= 0; i--) {
      if (
        model == localFlags[i].get('model') &&
        modelId == localFlags[i].get('modelId')
      ) {
      return localFlags[i];
      }
    }
    return false;
  }
})
