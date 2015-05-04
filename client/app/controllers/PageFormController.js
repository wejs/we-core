App.PageFormController = Ember.ObjectController.extend( App.ImageSelectorMixin, {
  isSaving: false,

  breadCrumb: 'create',

  actions: {
    saveRecord: function() {
      var self = this;
      var data = this.get('record');
      var record;

      if (!data.id) {
        record = this.get('store').createRecord('page', data);
      } else {
        record = data;
      }

      var featuredImage = this.get('imageToSave');

      this.set('isSaving', true);

      this.send('saveImage', featuredImage, function(err, salvedImage) {
        if (featuredImage && salvedImage) {
          record.set('featuredImage', salvedImage);
        }

        record.save().then(function(r) {
          self.set('isSaving', false);
          self.transitionToRoute('page', r.id);
        });
      });
    },
    saveAndPublishRecord: function() {},
    cancel: function() {
      var record = this.get('record');

      if (record.id) {
        record.rollback();
        this.transitionToRoute('page', record.id);
      } else {
        this.transitionToRoute('pages');
      }
    }
  }
});

