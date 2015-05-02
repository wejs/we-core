/**
 *  we-activities component
 *
 * Timeline
 * {{we-activities userId=userId}}
 *
 * Group activity:
 * {{we-activities group=group}}
 *
 * User Activity:
 * {{we-activities userId=userId}}
 */

App.inject( 'component:we-activities', 'store', 'store:main' );

App.WeActivitiesComponent = Ember.Component.extend(App.WeLoadMoreMixin, {
  showSharebox: true,
  activity: null,
  // filter by user acttivities
  userId: null,
  // filter by group acttivities
  groupId: null,

  isLoading: true,

  isSearching: false,

  searchString: '',

  where: {},

  length: Ember.computed.oneWay('activity.length'),

  // search
  contextualFilter: null,
  currentQuery: null,

  selectedSort: 'createdAt',
  sortProperties: ['createdAt'],
  sortAscending: false,

  defaultSort: 'createdAt DESC',
  sort: 'createdAt DESC',
  sortOptions: [
    {
      value: 'createdAt DESC',
      label: 'sort.label.new'
    },
    {
      value: 'createdAt ASC',
      label: 'sort.label.old'
    },
    {
      value: 'updatedAt DESC',
      label: 'sort.label.updated'
    }
  ],

  postIsLoading: Ember.computed.alias('parentController.isSearching'),

  // static object used to track translated structures
  translatedsObjects: {},

  init: function() {
    this._super();

    // localizate sortOptions
    if(!this.translatedsObjects.sortOptions){
      this.get('sortOptions').forEach(function(option){
        option.label = Ember.I18n.t(option.label);
      })
      this.translatedsObjects.sortOptions = true;
    }
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
    if(this.get('groupId') && this.get('user')) {
      // activity created by user in group
      userId = this.get('user.id');
      groupId = this.get('groupId');
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
    } else if(this.get('groupId')) {
      // activity created in group
      groupId = this.get('groupId');
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

      this.set('isSearching', true);
      self.set('activity', []);

      self.set('page', 1);

      var query = this.getCurrentQuery();

      store.find('activity', query).then(function (res) {
        self.set('count', res.meta.count);
        if(this.isDestroyed) return;
        // reset posts filter
        self.set('activity', self.getNewFilterFunction());
        self.set('isLoading', false);
        self.set('isSearching', false);
      });
    },
    // -- SEARCH FEATURE
    filter: function() {
      var sort = this.get('sort');

      if (sort) {
        if(sort.indexOf('createdAt') > -1) {
          this.set('sortProperties', ['createdAt']);
        } else {
          this.set('sortProperties', ['updatedAt']);
        }

        if (sort.indexOf('ASC') > -1) {
          this.set('sortAscending', true);
        } else {
          this.set('sortAscending', false);
        }
      } else {
        this.set('sortProperties', ['createdAt']);
        this.set('sortAscending', false);
      }

      this.send('searchRecords');
    },

    resetSearch: function(){
      this.setProperties({
        page: 1,
        searchString: null,
        currentQuery: null,
        haveMore: true,
        sortProperties: ['createdAt'],
        sortAscending: false,
        sort: this.get('defaultSort')
      });

      this.send('searchRecords');
    }
  },

  /**
   * Build url query object
   *
   * @return {object} object with current query for user with $.ajax
   */
  getCurrentQuery: function(where) {
    var query = {
      where: {}
    };

    if (where) query.where = where;
    if (this.get('groupId')) query.where.groupId = this.get('groupId');
    if (this.get('userId')) query.where.actor = this.get('userId');
    query.limit = this.get('limit');
    if (this.get('page')) query.offset = query.limit * (this.get('page') -1);
    // TODO add suport to search in we.js 0.3.x
    if (this.get('searchString')) {
      query.body = { contains: this.get('searchString') };
    }
    if(this.get('perPage')) query.limit = this.get('perPage');
    if(!query.sort) query.sort = this.get('sort');

    query.where = JSON.stringify(query.where);
    return query;
  }
});
