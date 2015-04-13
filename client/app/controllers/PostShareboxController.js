(function($, Ember, App){

  // a clean post object for help reset post in sharebox
  App.postClean = function(){
    return  {
      body: '',
      'isOpen': false,
      'shareboxClass': 'small',
      'shareImages': false,
      'files': [],
      'sharedIn': [],
      'sharedWith': [],
      'images': [],
      'videos': [],
      'links':[],
      'wembed': null,
      'newWembed': null
    };
  };

  App.PostShareboxController = Ember.ObjectController.extend(
    App.LoggedInMixin,
    App.WembedLinkerMixin,
    App.PostMecanismMixin,
  {
    // the post to save
    post: null,

    canCreatePost: function() {
      return App.get('currentUser.id');
    }.property('App.currentUser.id'),

    onNewWembed: function () {
      this.set('wembed', this.get('newWembed'))
    }.observes('newWembed'),

    imageUploadUrl: '/api/v1/images',
    // if are selection attach options
    // used to show or hide attach options buttons selector
    selectingAttachOption: function(){
      if(this.get('files.length') || this.get('videos.length') ) return false;
      return true;
    }.property('files.length','videos.length'),

    images: [],
    // new files object watcher
    filesNew: {},
    isSending: true,

    filesDidChange: function() {
      var files = this.get('filesNew');
      this.get('files').pushObject(files[0]);
    }.observes('filesNew'),

    emptyData: function() {
      this.set('post', this.store.createRecord('post'));
      this.setProperties(App.postClean());
    },

    actions: {
      openBox: function openBox(){
        this.setProperties({
          'isOpen': true,
          'shareboxClass': 'normal'
        });
      },
      cancel: function closeBox(){
        this.emptyData();
      },
      submit: function submit(){
        var self = this;
        this.set('isSending',true);

        if( self.get('wembed.wembedId') ) {
          self.send('saveWembed');
        } else {
          var files = self.get('files');
          var uploadUrl = self.get('imageUploadUrl');
          // first start image upload
          this.send('uploadImages',files, uploadUrl, function(err, images) {
            if (err) {
              Ember.Logger.error('Error on upload post image', err);
            }
            if(images){
              // set image ids to save in model
              self.set('model.imagesToSave', images);
            }

            self.send('savePost');
            self.set('isSending',false);
          });

        }
      },

      saveWembed: function saveWembed(){
        var store = this.get('store');
        var self = this;

        store.find('user', App.currentUser.id)
        .then(function(user){

          var wembed = store.createRecord('wembed', self.get('wembed'));
          wembed.setProperties({
            'creator': user
          });

          wembed.save().then(function(){
            self.set('wembed', wembed);
            self.send('savePost');
          });

        });
      },
      /**
       * Save the post on server
       */
      savePost: function savePost(){
        var self = this;
        var postNew = this.get('model');
        var sharedWith = postNew.sharedWith;
        var images = Ember.get(postNew, 'imagesToSave');

        delete postNew.imagesToSave;
        delete postNew.images;
        delete postNew.sharedWith;
        delete postNew.sharedIn;

        var store = this.get('store');
        var group = this.parentController.get('group');

        store.find('user', App.get('currentUser.id') )
        .then(function(user){

          // create new post on store
          var post = store.createRecord('post', postNew);
          post.setProperties({
            'creator': user
          });

          if (group) post.set('sharedIn', group);
          if (images) post.get('images').pushObjects(images);
          if (sharedWith) post.get('sharedWith').pushObjects(sharedWith);

          // delete unneed files variable
          delete post.files;
          delete post.filesNew;

          post.save().then(function(){
            // close and clear sharebox form inputs
            self.send('newPost', post);
            self.emptyData();
          });
        });
      }
    }
  });

})(jQuery, Ember, App);