App.inject( 'component:we-group-list', 'store', 'store:main' );

App.WeGroupListComponent = Ember.Component.extend({
  records: null,

  memberId: null,

  limit: 9,
  page: 0,
  count: 0,

  // delay to start in ms
  delayToStart: 500,

  didInsertElement: function didInsertElement() {
    this._super();
    Ember.run.later(null, this.start.bind(this), null, this.get('delayToStart'));
  },

  start: function() {
    this.send('searchRecords');
  },

  actions: {
    searchRecords: function() {
      if (this.get('memberId')) this.send('searchUserRecords');

      var self  = this;
      var store = this.get('store');
      var memberId =  this.get('memberId');

      this.set('isSearching', true);
      self.set('records', []);

      var query = this.get('query');
      if (!query) query = {
        where: {}
      };

      if (memberId) query.memberId = memberId;
      if(!query.limit) query.limit = this.get('limit');

      self.set('page', 1);

      if(!query.sort) query.sort = 'createdAt DESC';

      if (
        !Ember.isEmpty(query.where) &&
        ( typeof query.where == 'object' )
      ) {
        query.where = JSON.stringify(query.where);
      }

      store.find('group', query)
      .then(function (res) {
        if(self.isDestroyed) return;

        self.set('count', res.meta.count);
        // reset posts filter
        self.set('records', res);
        self.set('isLoading', false);
        self.set('isSearching', false);
      });
    },

    searchUserRecords: function() {
      var self  = this;
      var store = this.get('store');
      var memberId =  this.get('memberId');

      this.set('isSearching', true);
      self.set('records', []);

      var query = this.get('query');
      if (!query) query = {
        where: {}
      };

      if (memberId) query.memberId = memberId;
      if(!query.limit) query.limit = this.get('limit');

      self.set('page', 1);

      if(!query.sort) query.sort = 'createdAt DESC';

      if (
        !Ember.isEmpty(query.where) &&
        ( typeof query.where == 'object' )
      ) {
        query.where = JSON.stringify(query.where);
      }

      $.ajax({
        url: '/user/' + memberId + '/membership',
        data: query,
      }).done(function(res) {
        if(self.isDestroyed) return;

        self.set('count', res.meta.count);
        // reset posts filter
        self.set('records', store.pushMany('membership', res.membership) );
        self.set('isLoading', false);
        self.set('isSearching', false);
      })
      .fail(function(xhr) {
        Ember.Logger.error('Erro on load user membership', xhr);
      })
      .always(function() {
        self.set('isSearching', true);
      });
    }
  }
});