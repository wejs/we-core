// TODO move this object to other file
window.FlagObject = Ember.Object.create({
  // a index to store flags in model:modelId format
  flagIndex: {},
  saveInCache: function(flagType, model, modelId, value, count) {
    if( !this.flagIndex[flagType] ) {
      this.flagIndex[flagType] = {};
    }

    if (count) {
      this.flagIndex[flagType][model+'/'+modelId+'-count'] = count;
    }

    return this.flagIndex[flagType][model+'/'+modelId] = value;
  },
  getFromCache: function(flagType, model, modelId) {
    if( !this.flagIndex[flagType] ) {
      return false;
    }
    return {
      flag: this.flagIndex[flagType][model+'/'+modelId],
      count: this.flagIndex[flagType][model+'/'+modelId+'-count']
    };
  },
  upCount: function(flagType, model, modelId) {
    if( !this.flagIndex[flagType] ) {
      this.flagIndex[flagType] = {};
    }

    return this.flagIndex[flagType][model+'/'+modelId+'-count']++;
  },
  downCount: function(flagType, model, modelId) {
    if( !this.flagIndex[flagType] ) {
      this.flagIndex[flagType] = {};
    }
    return this.flagIndex[flagType][model+'/'+modelId+'-count']--;
  },

  isFlagged: function(flagType, model, modelId, userId, store) {
    var self = this;
    // check if are on flag cache index to dont make other request on server for this data
    var flagIndex = self.getFromCache(flagType, model, modelId);
    if ( flagIndex && flagIndex.flag === 'notFlagged') {
      // this flag result is cached and user dont are flagged
      return new Ember.RSVP.Promise(function(resolve) {
        resolve({
          flag: {},
          count: flagIndex.count
        });
      });
    }

    var flagOnCache = self.checkInCache(flagType, model, modelId, store);

    if( flagOnCache && flagIndex ){
      return new Ember.RSVP.Promise(function(resolve) {
        resolve({
          flag: flagOnCache,
          count: flagIndex.count
        })
      });
    }

    return new Ember.RSVP.Promise(function isFollowingPromisse(resolve) {
      Ember.$.ajax({
        type: 'GET',
        url: '/api/v1/flag/'+model+'/'+modelId+'/'+userId+ '?flagType=' + flagType,
        dataType: 'json',
        contentType: 'application/json'
      }).done(function onSuccess(data) {

        if(!data.meta && data.meta) {
          data.meta = { count: 0 } ;
        }

        if (data.flag && data.flag[0]) {
          // save in index cache
          self.saveInCache(flagType, model, modelId, 'flagged', data.meta.count);

          resolve ({
            flag: store.push('flag', data.flag[0]),
            count: data.meta.count
          });

        } else {
          // save in index cache
          self.saveInCache(flagType, model, modelId, 'notFlagged', data.meta.count);
          // resolve it
          resolve({
            flag: {},
            count: data.meta.count
          });
        }
      }).fail(function onFail(){
        resolve({});
      });
    });
  },

  flag: function (flagType, model, modelId, store) {
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      Ember.$.ajax({
        type: 'POST',
        url: '/api/v1/flag/' + model + '/' + modelId + '?flagType=' + flagType,
        dataType: 'json',
        contentType: 'application/json'
      }).done(function(data){
        if (data.flag && data.flag) {
          // save in index cache
          self.saveInCache(flagType, model, modelId, 'flagged');
          self.upCount(flagType, model, modelId);
          resolve( store.push('flag',data.flag) );
        } else {
          resolve({});
        }
      }).fail(reject);
    });
  },

  unFlag: function(flagType ,model, modelId, flagId, store) {
    var self = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.$.ajax({
        type: 'DELETE',
        url: '/api/v1/flag/' + model + '/' + modelId + '?flagType=' + flagType
      }).done(function(){
        // save in index cache
        self.saveInCache(flagType, model, modelId, 'notFlagged');
        self.downCount(flagType, model, modelId);
        if ( store.hasRecordForId ('flag', flagId) ) {
          store.find('flag', flagId).then(function(record){
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
  checkInCache: function(flagType, model, modelId, store) {
    var localFlags = store.all('flag').content;
    for (var i = localFlags.length - 1; i >= 0; i--) {
      if (
        model == localFlags[i].get('model') &&
        modelId == localFlags[i].get('modelId') &&
        flagType == localFlags[i].get('flagType')
      ) {
      return localFlags[i];
      }
    }
    return false;
  }
})


$(function() {
  App.Flag.reopen({
    count: DS.attr('number')
  })
})
