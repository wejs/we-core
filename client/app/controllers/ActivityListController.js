App.ActivityListController = Ember.ArrayController.extend({
  sortProperties: ['createdAt'],
  sortAscending: false,
  // sortAscending: function() {
  //   var sort = this.get('sort');
  //   if (!sort) return false;
  //   if (sort.indexOf('ASC') > -1) return true;
  //   return false;
  // }.property('sort'),

  selectedSort: 'createdAt',

  postIsLoading: Ember.computed.alias('parentController.isSearching'),

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

  // timeline get old itens vars
  modelType: 'post',
  page: 1,
  perPage: 10, // this is updated in init function
  skip: 0,
  count: Ember.computed.oneWay('parentController.count'),

  loadingMore: false,
  haveMore: true,

  where: {},

  // search
  searchString: Ember.computed.alias('parentController.searchString'),
  contextualFilter: null,
  currentQuery: Ember.computed.alias('parentController.query'),

  // static object used to track translated structures
  translatedsObjects: {},

  init: function() {
    this._super();

    if (this.get('parentController.limit')) {
      // set limit to same as parent controller limit
      this.set('perPage', this.get('parentController.limit'));
    }

    // localizate sortOptions
    if(!this.translatedsObjects.sortOptions){
      this.get('sortOptions').forEach(function(option){
        option.label = Ember.I18n.t(option.label);
      })
      this.translatedsObjects.sortOptions = true;
    }
  },

  /**
   * Build url query object
   *
   * @return {object} object with current query for user with $.ajax
   */
  getCurrentQuery: function(where){
    var sort = this.get('sort');
    var query;

    if (!where) where = this.get('where');

    if (where) {
      query = {
        where: JSON.stringify(where)
      };
    } else {
      query = {};
    }

    if(this.get('perPage')) query.limit = this.get('perPage');
    if(sort) query.sort = sort;

    this.set('currentQuery', query);

    return query;
  },
  actions: {
    // -- SEARCH FEATURE
    filter: function() {
      var searchString = this.get('searchString');
      var sort = this.get('sort');

      var query = {};

      if (searchString) {
        query.body = { contains: searchString };
      }

      this.set('where', query);
      this.getCurrentQuery();

      this.send('searchRecords');

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

    },

    resetSearch: function(){
      this.setProperties({
        page: 1,
        searchString: null,
        currentQuery: null,
        haveMore: true,
        sort: this.get('defaultSort')
      });

      this.send('searchRecords');
    },

    // -- LOAD MORE FEATURE
    getMore: function() {
      var self = this;
      // if dont have more skip this feature
      // in one timeline new contents go to timeline start and are added with push
      if (!this.get('haveMore')) return ;
      // don't load new data if we already are
      if (this.get('loadingMore')) return ;
      this.set('loadingMore', true);
      // add some delay after get more content from server
      Ember.run.later(function() {
        // get skip value
        // TODO change this to createdAt time
        var skip = self.get('page') * self.get('perPage');

        var query = self.getCurrentQuery();
        query.skip = skip;
        query.limit = self.get('perPage');

        self.store.find( self.get('modelType'), query).then(function(posts){
          if((Ember.get(posts,'content.length') + self.get('length') ) < self.get('count') ) {
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
        loadingMore: false,
        page: this.get('page') + 1,
      });
    },
    dontHaveMore: function() {
      this.setProperties({
        loadingMore: false,
        haveMore: false
      });
    }
  }
});
