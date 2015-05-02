App.ImageSelectorMixin = Ember.Mixin.create({

  imageUploadUrl: '/api/v1/image',

  selectedImage: null,
  imageToSave: null,
  selectedPreviewImage: null,

  imageSelectorInputReset: false,

  onSelectImage: function() {
    var files = this.get('selectedImage');
    if (files && files[0]) {
      var self = this;
      var reader = new FileReader();
      this.set('imageToSave', files[0]);

      reader.onload = function (e) {
        // get local file src
        self.set('selectedPreviewImage', e.target.result);
      };
      reader.readAsDataURL(files[0]);

      // reseta o seletor de imagens
      this.set('selectedDestaqueImage', null);
    }
  }.observes('selectedImage'),



  actions: {
    resetSelectedImage: function() {
      this.set('selectedPreviewImage', null);
      this.set('imageToSave', null);
      this.set('selectedImage', null);

      // reset the input
      this.set('imageSelectorInputReset', true);
      var self = this;
      Ember.run.later((function() {
        self.set('imageSelectorInputReset', false);
      }), 50);
    },

    saveImage: function(image, callback) {
      var self = this;
      var file = image;

      if (!Ember.isEmpty(file)) {
        self.set('isLoading', true);

        var uploader = Ember.Uploader.create({
          url: this.get('imageUploadUrl'),
          type: 'POST',
          paramName: 'image'
        });

        var promisseUpload = uploader.upload(file);
        promisseUpload.then(function uploadFilesSuccess(data) {
          // Handle success
          if (data.image && data.image[0]) {
            // sabe image in store
            var image = self.get('store').push('image', data.image[0]);
            if (callback) return callback(null, image);
          } else {
            if (callback) return callback(null, null);
          }

        }, function uploadFilesError (error) {
          Ember.Logger.error('Erro on save image', error);
          callback(error, null);
        });
      } else {
        if (callback) return callback(null, null);
      }
    }
  }

});