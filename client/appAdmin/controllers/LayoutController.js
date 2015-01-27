App.LayoutController = Ember.ObjectController.extend({

  isSaving: false,

  isVisibleCreateRegionForm: false,

  actions: {
  	showCreateRegionForm: function() {
			this.set('isVisibleCreateRegionForm', true);
  	},

  	cancelCreateRegion: function() {
			this.set('isVisibleCreateRegionForm', false);
  	},

    createAndAddRegion: function(){
      var self = this;
      var layout = this.get('record');
      var region = this.get('newRegion');

      if (!region.get('order')) region.set('order', 0);

			region.set('layout', layout);

      self.set('isSaving', true);

      region.save().then(function(r) {
      	r.set('layout', layout);
        self.set('isSaving', false);
        self.set('isVisibleCreateRegionForm', false);

        self.set('newRegion', self.get('store').createRecord('region', {
          columns: 12
        }) )

      });
    }
  }
});