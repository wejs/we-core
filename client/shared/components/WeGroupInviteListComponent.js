App.inject( 'component:we-group-invite-list', 'store', 'store:main' );

App.WeGroupInviteListComponent = Ember.Component.extend({
  records: null,

  isLoading: true,
  // delay to start in ms
  delayToStart: 500,

  limit: 9,
  page: 0,
  count: 0,

  groupId: null,


  didInsertElement: function didInsertElement() {
    this._super();
    Ember.run.later(null, this.start.bind(this), null, this.get('delayToStart'));
  },

  start: function() {
    this.send('searchRecords');
  },

  actions: {
    searchRecords: function() {
      var self  = this;

      this.set('isSearching', true);
      self.set('records', []);

      var query = this.get('query');
      if (!query) query = {
        where: {}
      };

      if(!query.limit) query.limit = this.get('limit');

      self.set('page', 1);

      if(!query.sort) query.sort = 'createdAt DESC';

      if (
        !Ember.isEmpty(query.where) &&
        ( typeof query.where == 'object' )
      ) {
        query.where = JSON.stringify(query.where);
      }

      Ember.$.ajax({
        url: '/group/'+ this.get('groupId') +'/members/invites',
        type: 'GET',
        dataType: 'json',
        data: query
      }).then(function(res) {
        self.set('count', res.meta.count);
        // reset posts filter
        self.set('records', res.membershipinvite);
      }).fail(function( jqXHR, textStatus, errorThrown) {
        return Ember.Logger.error('Error on inviteUser',textStatus, errorThrown);
      }).always(function(){
        self.set('isLoading', false);
        self.set('isSearching', false);
      });
    },
  }

});



