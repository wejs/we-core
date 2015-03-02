App.UserEditController = Ember.ObjectController.extend({
	actions: {
		save: function () {
			var self = this;
			var user = self.get('record.content');

			Ember.$('.save-success').button('loading');

			self.updateProvider(user)
			.then(function (updatedUser){
				user.save().then(function (user){
					Ember.$('.save-success').button('reset');
					self.transitionToRoute('user.view', user.id);
				}, function (error){
					user.rollback();
					Ember.$('.save-success').button('reset');
					console.log(error);
				});				
			})
			.fail(function (error){
					user.rollback();
					Ember.$('.save-success').button('reset');
					console.log(error);
			});
		}
	},

	updateProvider: function (user) {
		var accounts = we.configs.server.providers.accounts;
		var url = '';
		var changed = user.changedAttributes();
		
		if (user.get('idInProvider')){
			url = accounts + '/user/' + user.get('idInProvider');

			if (!user._attributes.username) user._attributes.username = user.get('username');

			return Ember.$.ajax({
			  url: url,
			  dataType: 'json',
			  type: 'PUT',
			  crossDomain: true,
			  xhrFields: {
	     		withCredentials: true
	   		},
			  data: user._attributes
			});

		} else {
			var email = user.get('email');
			if (changed['email']) email = changed['email'][0];

			url = accounts + '/user?email=' +  email;

			if (!user._attributes.username) user._attributes.username = user.get('username');

			return Ember.$.ajax({
			  url: url,
			  dataType: 'json',
			  type: 'GET',
			  crossDomain: true,
			  xhrFields: {
	     		withCredentials: true
	   		}
			}).then(function (response){
				if (!response.user[0]) throw 'No user found with this email on provider';

				url = accounts + '/user/' + response.user[0].id;

				return Ember.$.ajax({
				  url: url,
				  dataType: 'json',
				  type: 'PUT',
				  crossDomain: true,
				  xhrFields: {
		     		withCredentials: true
		   		},
		   		data: user._attributes
	   		});

			});			
		}
	},
});
