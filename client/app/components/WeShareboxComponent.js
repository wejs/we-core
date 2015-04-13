App.inject( 'component:we-sharebox', 'store', 'store:main' );

App.WeShareboxComponent = Ember.Component.extend(
  App.WembedLinkerMixin,
  App.PostMecanismMixin, {

  post: {},

  // posts sending list
  postsSending: [],

  resetImageSelector: false,

  //newPost: 'onNewPost',
  shareboxClass: function(){
    if(this.get('post.isOpen')) return 'small';
    return 'small';
  }.property('post.isOpen'),

  canCreatePost: function() {
    return App.get('currentUser.id');
  }.property('App.currentUser.id'),

  init: function() {
    this._super();
    this.set('postsSending', this.store.filter('post', function (record) {
      if(Ember.get(record, 'isSending')) {
        return true;
      }
      return false;
    }));
  },

  didInsertElement: function() {
    this._super();
    this.set('post', null);
    this.set('newWembed', null);
  },

  actions: {
    openBox: function openBox() {
      this.resetRecord();
      this.get('post').setProperties({
        'isOpen': true,
        'shareboxClass': 'normal',
        'newWembed': null
      });
    },
    cancel: function closeBox(){
      this.set('post', null);
    },

    setContentType: function setContentType(contentTypeName) {
      this.set('post.contentType', contentTypeName);
    },

    /**
     * Remove one image from imagesToSave array
     * @param  {[type]} imageObj upload image object
     */
    onRemoveImage: function onRemoveImage(imageObj){
      this.get('post.imagesToSave').removeObject(imageObj);
      // if removed last image from selected images hide the image selector
      if(!this.get('post.imagesToSave.length')){
        this.set('post.contentType', null);
      }
    },

    submit: function submit() {
      var self = this;
      var post = this.get('post');
      // set the post saver flag
      post.set('isSending', true);
      // reset sharebos post to clean
      this.set('post', null);
      this.set('newWembed', null);

      var user = App.get('currentUser');
      var newWembed = post.get('newWembed');

      if( newWembed ) {
        var wembed = this.store.createRecord('wembed', newWembed);
        wembed.setProperties({
          'creator': user
        });

        wembed.save().then(function() {
          post.set('wembed', wembed);
          self.send('save', post);
        });
      } else {
        var images = self.get('imagesToSave');
        var uploadUrl = App.get('imageUploadUrl');
        if(Ember.isEmpty(images) || !uploadUrl) return self.send('save', post);

        var uploader = Ember.Uploader.create({
          url: uploadUrl,
          type: 'POST',
          paramName: 'images'
        });
        var promisseUpload = uploader.upload(images);
        promisseUpload.then(function uploadFilesSuccess(data) {
          // Handle success
          if (data.images) {
            // set salved images in post
            self.get('images').pushObjects(self.get('store').pushMany('image',data.images));
          }
          self.send('save', post);
        }, function uploadFilesError(error) {
          // Handle failure
          Ember.Logger.error('Error on upload post image', error);
          // but continue and save the post
          self.send('save', post);
        });
      }
    },
    save: function(post) {
      var self = this;
      post.save().then(function(){
        // clear cache browser images
        post.set('imagesToSave', null);
        post.set('isSending', false);
        post.set('inSendingProcess', false);
        self.set('post', null);

        if (self.get('group.id')) self.send('addPostInGroup', post);
      });
    },

    addPostInGroup: function(post) {
      var groupId = this.get('group.id');

      Ember.$.ajax({
        type: 'POST',
        url: '/api/v1/group/'+ groupId +'/addContent/post/' + post.id
      })
      .done(function(result) {
        console.log('result>', result)
      })
      .fail(function(xhr) {
        console.log('error>', xhr)
      })
      .always(function() {
        console.log('doneALl')
      });
    }
  },

  resetRecord: function() {
    var post = this.get('store').createRecord('post');
    post.setProperties({
      'creator': App.get('currentUser'),
      // temp vars
      'imagesToSave': []
    });
    this.set('post', post);
  },

  // types selectors
  isImageType: function() {
    return (this.get('post.contentType') == 'image');
  }.property('post.contentType'),

  isLinkType: function() {
    return (this.get('post.contentType') == 'link');
  }.property('post.contentType'),

  // // WEMBED!
  onNewWembed: function () {
    if(!this.get('newWembed')) return;
    if(!this.get('post.contentType')) {
      this.set('post.contentType', 'link');
    }
    this.set('post.newWembed', this.get('newWembed'));
  }.observes('newWembed'),

  // FILES
  selectedImageDidChange: function() {
    var self = this;
    var files = this.get('post.selectedImage');
    if(!files || !files[0]) return;
    this.get('post.imagesToSave').pushObject(files[0]);
    // reset input
    self.set('resetImageSelector', true);
    Ember.run.later(null, function(){
      self.set('resetImageSelector', false);
    }, null, 10);

  }.observes('post.selectedImage'),

});