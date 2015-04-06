App.PageFormController = Ember.ObjectController.extend( App.ImageSelectorMixin, {
  isSaving: false,

  breadCrumb: 'create',

  headerImage: function() {
    if (this.get('selectedPreviewImage')) {
      return this.bgStyle(this.get('selectedPreviewImage'));
    }
    var image = this.get('record.featuredImage');
    if(image && image.get('urls')) {
      return this.bgStyle( image.get('urls').original )
    }
    return this.bgStyle();
  }.property('record.featuredImage.urls', 'selectedPreviewImage'),

  bgStyle: function(url) {
    if(!url) url = this.get('defaultHeaderImage');
    return 'background-image: url("'+ url +'");';
  },

  defaultHeaderImage: function() {
    if (App.get('configs.client.publicVars.showDefaultArticleImage')) {
      url = App.get('configs.client.publicVars.blogArticlesBg');
    } else {
      return '';
    }
  }.property('App.configs.client.publicVars.blogArticlesBg'),

  actions: {
    saveRecord: function() {
      var self = this;
      var record = this.get('record');
      var featuredImage = this.get('imageToSave');

      this.set('isSaving', true);

      this.send('saveImage', featuredImage, function(err, salvedImage) {
        if (featuredImage && salvedImage) {
          record.set('featuredImage', salvedImage);
        }

        record.save().then(function(r) {
          self.set('isSaving', false);
          self.transitionToRoute('page', r.id);
        })
      });
    },

    createRecord: function(){
      var self = this;
      var record = this.get('record');
      var featuredImage = this.get('imageToSave');

      this.set('isSaving', true);

      this.send('saveImage', featuredImage, function(err, salvedImage) {
        if (featuredImage && salvedImage) {
          record.set('featuredImage', salvedImage);
        }

        record.save().then(function(r) {
          self.set('isSaving', false);
          self.transitionToRoute('page', r.id);
        })
      });
    },

    cancel: function() {
      var record = this.get('record');

      if (record.id) {
        record.rollback();
        this.transitionToRoute('page', record.id);
      } else {
        this.transitionToRoute('pages');
      }
    },
    deleteRecord: function () {
      var self = this;
      this.set('isSaving', true);

      var record = this.get('record');
      record.destroy().then(function(){
        self.transitionToRoute('pages');
      })
    }
  }
});