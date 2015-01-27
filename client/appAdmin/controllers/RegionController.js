App.RegionController = Ember.ObjectController.extend({
  columnsOptions: [1,2,3,4,5,6,7,8,9,10,11,12],
  regionClass: function() {
    return 'region col-md-' + this.get('model.columns');
  }.property('model.columns'),

  actions: {
    saveRecord: function() {
      var record = this.get('model');

      record.save();
    }
  }
});