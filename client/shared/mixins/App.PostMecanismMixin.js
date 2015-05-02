// TODO move this mixin to one mixins file
App.PostMecanismMixin = Ember.Mixin.create({
  checkLinkKeys: [32, 13],
  actions: {
    onChangeText: function(editor, event) {
      var self = this;
      // only start attach url with enter or space
      if(self.get('checkLinkKeys').indexOf(event.keyCode) > -1 ) {
        self.checkLinks(editor.code());
      }
    },
    onPasteText: function(editor) {
      var self = this;
      console.warn('on paste body');
     // wait editor set pasted values
      Ember.run.later(self, function() {
        self.checkLinks(editor.code());
        self.set('value',editor.code());
      }, 150);
    },

    openShareImage: function openShareImage() {
      this.setProperties({
        'shareImages': true
      });
    },
    onDeleteWembed: function () {
      if(this.get('post.wembed')) {
        this.set('post.wembed', null);
      } else {
        this.set('wembed', null);
      }

      this.set('newWembed', null);
    },

    /**
     * Remove one image from imagesToSave array
     * @param  {[type]} imageObj upload image object
     */
    onRemoveImage: function onRemoveImage(imageObj){
      this.get('files').removeObject(imageObj);
      // if removed last image from selected images hide the image selector
      if(!this.get('files.length')){
        this.set('shareImages', false);
      }
    },
    /**
     * Upload images to server
     * @param  {array}   files     Array with files to upload
     * @param  {string}   uploadUrl url to upload the files
     * @param  {Function} callback  function to callback with callback(error)
     */
    uploadImages: function uploadImages(files, uploadUrl, callback){
      var self = this;

      // callback is optional
      if(!callback) callback = function fakeCallback(){};

      var uploader = Ember.Uploader.create({
        url: uploadUrl,
        type: 'POST',
        paramName: 'images'
      });
      if (!Ember.isEmpty(files)) {
        var promisseUpload = uploader.upload(files);
        promisseUpload.then(function uploadFilesSuccess(data) {
          // Handle success
          if(data.images){
            // store new images on ember data
            var salvedImages = self.get('store').pushMany('image',data.images);
            callback(null, salvedImages);
          }else{
            callback(null, []);
          }
        }, function uploadFilesError(error) {
          // Handle failure
          callback(error);
        });
      }else{
        // no files to send
        callback(null);
      }
    }
  }
});