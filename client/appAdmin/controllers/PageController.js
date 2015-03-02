App.PageController = Ember.ObjectController.extend({

  breadCrumb: function() {
    return this.get('record.id');
  }.property('record.id'),

  isSaving: false,

  actions: {

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