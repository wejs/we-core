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

  where: {},

  // timeline get old itens vars
  modelType: 'activity',
  page: 1,
  loadingMore: false,
  haveMore: true,

  limit: 7,
  count: null,

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

  didInsertElement: function didInsertElement() {
    this._super();
    // wait some time to load activity from server
    Ember.run.later(null, this.start.bind(this), null, this.get('delayToStart'));

    $(window).on('scroll', $.proxy(this.didScroll, this) );
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
    } else if(this.get('group')) {
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
    },
    // -- LOAD MORE FEATURE
    getMore: function() {
      var self = this;
      // if dont have more offset this feature
      // in one timeline new contents go to timeline start and are added with push
      if (!this.get('haveMore')) return ;
      // don't load new data if we already are
      if (this.get('loadingMore')) return ;
      this.set('loadingMore', true);

      this.incrementProperty('page');

      // add some delay after get more content from server
      Ember.run.later(function() {
        var query = self.getCurrentQuery();

        self.store.find( self.get('modelType'), query).then(function(r){
          if((Ember.get(r,'content.length') + self.get('length') ) < self.get('count') ) {
            self.send('gotMore');
          }else{
            self.send('dontHaveMore');
          }
        });
      }, 500);
    },

    // Also add a method `gotMore` that the route can call back to
    // notify the controller that the new data is in and it can stop
    // showing its loading indicator
    gotMore: function() {
      this.setProperties({
        loadingMore: false
      });
    },
    dontHaveMore: function() {
      this.setProperties({
        loadingMore: false,
        haveMore: false
      });
    }
  },

  onClickGetMore: function() {
    this.send('getMore');
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
  },
  willDestroyElement: function(){
    // have to use the same argument to `off` that we did to `on`
    $(window).off('scroll', $.proxy(this.didScroll,this) );
  },

  // this is called every time we scroll
  didScroll: function() {
    if (this.isScrolledToBottom()) {
      this.send('getMore');
    }
  },

  // we check if we are at the bottom of the page
  isScrolledToBottom: function(){
    var distanceToViewportTop = (
      $(document).height() - $(window).height());
    var viewPortTop = $(document).scrollTop();

    if (viewPortTop === 0) {
      // if we are at the top of the page, don't do
      // the infinite scroll thing
      return false;
    }

    return (viewPortTop - distanceToViewportTop === 0);
  }
});
