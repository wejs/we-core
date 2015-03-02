App.WeOauthSearchComponent = Ember.Component.extend({
  classNames: ['modal', 'fade'],
  attributeBindings: ['id'], 
  id: 'we-oauth-search',
  store: null,
  notInCdp: false,
  msgNotFound: function (){
  	if (this.get('notFound') && !this.get('user')) {  		  		
  		return true;
  	}
  	return false;
  }.property('user', 'notFound'),

  isValid: function (){
  	if (!this.get('validator')) return false;
  	return this.get('validator').isValid();
  }.property('cpf'),

  checkIfIsInCdp: function (){
  	Ember.run.once(this, 'inCdp');
  }.observes('user'),

  inCdp: function (){
  	var self = this;
  	if (!self.get('user') || !self.get('store')) return self.set('notInCdp', false);
  	var email = self.get('user.email');
  	if (!email) return self.set('notInCdp', false);  	
  	self.get('store').find('user', {email: email})
  	.then(function (cdpUser){
  		if (cdpUser.get('length')) {  			
  			return self.set('notInCdp', true);
  		}
  		return self.set('notInCdp', false);
  	}, function (error){
  		console.debug('Error finding associated user in CdP system: ', error);
  		return self.set('notInCdp', false);
  	})
  },

  didInsertElement: function (){
  	Ember.$('.cpf-search-form').bootstrapValidator({
  		message: 'Valor invalido', 		
  		fields:{
	      cpf: {
	        validators: {
	          notEmpty: {
	            message: 'Campo cpf é obrigatório'
	          },
	          id: {
	            country: 'BR',
	            message: 'Número de CPF inválido.'
	          }
	        }
	      },  			
  		}
  	});
  	this.set('validator', Ember.$('.cpf-search-form').data('bootstrapValidator'));
    /// Your jQuery code here
    $('body').tooltip({
        selector: '[data-toggle="tooltip"]'
    });
  },

  actions: {
  	search: function () {
			var self = this;
			var cpf = self.get('cpf').replace(/[\.-]/g, '');

			Ember.$( '#' + self.get('id') + ' .search').button('loading');

  		// body...
			Ember.$.ajax({
			  url: we.configs.server.providers.accounts + '/user?cpf=' + cpf,
			  dataType: 'json',
			  type: 'GET',
			  crossDomain: true,
			  xhrFields: {
	     		withCredentials: true
	   		}
			}).then(function (response){
				Ember.$( '#' + self.get('id') + ' .search').button('reset');
				if (!response.user.length) {
					return self.setProperties({
						user: null,
						notFound: true
					})
				}
				self.set('user', response.user[0]);				
			}).fail(function (error){
				Ember.$( '#' + self.get('id') + ' .search').button('reset');
				console.log(error);
			});  		
  	},

  	updateEmail: function (){
  		if (!this.get('isValid')) return;
  		Ember.$('#' +  this.get('id') ).modal('hide');
  		this.sendAction('weOauthSearchSelected', this.get('user').email);
  	},

  	activateAccount: function (){
  		// body...
  		var self = this;

      Ember.$('#' + self.get('id') + ' .activate-loading').show();

  		self.set('user.active', true);	
  		var data = {
  			username: self.get('user.username'),
  			active: self.get('user.active')
  		}

			Ember.$.ajax({
			  url: we.configs.server.providers.accounts + '/user/' + this.get('user.id'),
			  dataType: 'json',
			  type: 'PUT',
			  crossDomain: true,
			  xhrFields: {
	     		withCredentials: true
	   		},
	   		data: data
			}).then(function (res){
				console.debug('userState: ', self.get('user.active'));
        Ember.$('#' + self.get('id') + ' .activate-loading').hide();				
			}).fail(function (error){
				console.log(error);
        Ember.$('#' + self.get('id') + ' .activate-loading').hide();
			}); 
  	}
  }
});

