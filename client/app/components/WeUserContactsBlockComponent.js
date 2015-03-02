App.inject( 'component:we-user-contacts-block', 'store', 'store:main' );

App.WeUserContactsBlockComponent = Ember.Component.extend({
  isLoading: true,
  users: null,

  loadRecordsFromServer: function(){
    var self = this;
    // user id is required
    if (!this.get('userId'))
      throw new Error('userId param is required to WeUserContactsBlockComponent');

    var url = '/user/' + this.get('userId') + '/get-some-user-contacts';
    self.set('isLoading', true);

    $.ajax({
      dataType: 'json',
      url: url,
    }).done(function (data) {
      if(self.isDestroyed) return;
      if (data && data.users && data.users.length) {
        self.set('users', self.get('store').pushMany('user', data.users) );
      }
    }).fail(function (xhr, status, err) {
      Ember.Logger.error('Error on WeUserContactsBlockComponent:loadRecords>',xhr, status , err);
    }).always(function(){
      if(self.isDestroyed) return;
      self.set('isLoading', false);
    });
  }.observes('userId').on('init')
});