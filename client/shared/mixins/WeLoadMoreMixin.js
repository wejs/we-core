App.WeLoadMoreMixin = Ember.Mixin.create({
  length: Ember.computed.oneWay('records.length'),

  modelType: 'activity',

  // delay to start in ms
  delayToStart: 500,

  page: 1,
  loadingMore: false,
  haveMore: true,

  limit: 7,
  count: null,

  didInsertElement: function didInsertElement() {
    this._super();
    // wait some time to load activity from server
    Ember.run.later(null, this.start.bind(this), null, this.get('delayToStart'));

    $(window).on('scroll', $.proxy(this.didScroll, this) );
  },

  willDestroyElement: function(){
    // have to use the same argument to `off` that we did to `on`
    $(window).off('scroll', $.proxy(this.didScroll,this) );
  },

  actions: {
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

        self.store.find( self.get('modelType'), query).then(function() {
          // check if have more records
          if ((self.get('length') ) < self.get('count') ) {
            self.send('gotMore');
          } else {
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
  },

  onClickGetMore: function() {
    this.send('getMore');
  }
});
