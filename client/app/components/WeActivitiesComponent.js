App.inject( 'component:we-activities', 'store', 'store:main' );

App.WeActivitiesComponent = Ember.Component.extend({
  showSharebox: true,

  activity: null,

  // filter by user acttivities
  userId: null,
  // filter by group acttivities
  groupId: null,
  // delay to start in ms
  delayToStart: 500,
  isLoading: true,

  isSearching: false,

  searchString: '',
  query: {
    where: {}
  },

  limit: 7,
  count: null,

  init: function init() {
    this._super();
  },
  didInsertElement: function didInsertElement() {
    this._super();
    // wait some time to load activity from server
    Ember.run.later(null, this.start.bind(this), null, this.get('delayToStart'));
  },
  validRecordStatus:function(record) {
    if(Ember.get(record, 'currentState.stateName') == 'root.loaded.created.uncommitted') {
      return false;
    }
    return true;
  },
  filterQuery:function(record) {
    var body = Ember.get(record, 'body');
    var searchString = this.get('searchString');
    if(Ember.isEmpty(searchString)) return true;
    if(searchString && Ember.isEmpty(body)) return false;
    if(body.indexOf(searchString) > -1 ) return true;
    return false;
  },
  start: function() {
    this.send('searchRecords');
  },

  getNewFilterFunction: function(){
    var self = this;
    var userId;
    var groupId;

    // set the filter
    if(this.get('group') && this.get('user')) {
      // activity created by user in group
      userId = this.get('user.id');
      groupId = this.get('group.id');
      return this.store.filter('activity', function (record) {
        if(!self.validRecordStatus(record)) return false;
        if(!self.filterQuery(record)) return false;
        if( record.get('actor') == userId ) {
          var sharedInId = Ember.get(record, 'groupId');
          if ( sharedInId == groupId) {
            return true;
          }
        }
        return false;
      });
    } else if(this.get('group')) {
      // activity created in group
      groupId = this.get('group.id');
      return this.store.filter('activity', function (record) {
        if(!self.validRecordStatus(record)) return false;
        if(!self.filterQuery(record)) return false;
        var sharedInId = Ember.get(record, 'groupId');
        if ( sharedInId == groupId) {
          return true;
        }
        return false;
      });
    } else if(this.get('user')) {
      // activity created by user
      userId = this.get('user.id');
      return this.store.filter('activity', function (record) {
        if(!self.validRecordStatus(record)) return false;
        if(!self.filterQuery(record)) return false;
        if(record.get('actor') == userId) {
          return true;
        }
        return false;
      });
    } else {
      return this.store.filter('activity', function (record) {
        if(!self.validRecordStatus(record)) return false;
        if(!self.filterQuery(record)) return false;
        return true;
      });
    }
  },

  loadRecords: function() {
    if(this.isDestroyed) return;
    return this.send('searchRecords');
  },

  actions: {
    // -- SEARCH
    searchRecords: function() {
      var self  = this;
      var store = this.get('store');
      var groupId = this.get('group.id');
      var userId =  this.get('user.id');

      this.set('isSearching', true);
      self.set('activity', []);

      var query = this.get('query');
      if (!query) query = {
        where: {}
      };

      if (groupId) query.where.groupId = groupId;
      if (userId) query.where.actor = userId;

      if(!query.limit) query.limit = this.get('limit');

      self.set('page', 1);

      if (!query) {
        return store.find('activity').then(function () {
          if(this.isDestroyed) return;
          self.set('isLoading', false);
        });
      }

      if(!query.sort) query.sort = 'createdAt DESC';

      if (
        !Ember.isEmpty(query.where) &&
        ( typeof query.where == 'object' )
      ) {
        query.where = JSON.stringify(query.where);
      }

      store.find('activity', query).then(function (res) {
        self.set('count', res.meta.count);
        if(this.isDestroyed) return;
        // reset posts filter
        self.set('activity', self.getNewFilterFunction());
        self.set('isLoading', false);
        self.set('isSearching', false);
      });
    }
  }
});
