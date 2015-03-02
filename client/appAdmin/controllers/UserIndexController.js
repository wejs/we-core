App.UserIndexController = Ember.ObjectController.extend({	
	user: null,

  pushToStore: function() {
  	if (this.get('user'))
  			return this.get('store').push('user', this.get('user'));
  }.observes('user'),

	actions: {
		weUserSearchSelected: function (userSelected) {
			// body...
			// userSelected.avatar = null;
			this.set('user', userSelected);
		},

		weOauthSearchSelected: function (email) {
			this.get('WeUserSearch').open();
			Ember.$('.select2-input').val(email);
		},
	}
});