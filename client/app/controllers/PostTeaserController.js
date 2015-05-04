(function($, Ember, App){

 App.PostTeaserController = Ember.ObjectController.extend(
  App.WembedLinkerMixin,
  App.PostMecanismMixin,
  {
    isEditing: false,

    shareInGroups: null,
    shareWithUsers: null,

    newWembed: null,

    files: [],

    /**
     * Image upload
     * @todo rename vars to image
     */
    filesDidChange: function() {
      var files = this.get('filesNew');
      if (files && files[0]) {
        this.get('files').pushObject(files[0]);
      }
    }.observes('filesNew'),

    onNewWembed: function () {
      this.set('wembed', this.get('newWembed'));
    }.observes('newWembed'),

    actions: {
      edit: function() {
        this.set('isEditing', true);
      },
      cancel: function() {
        this.set('isEditing', false);
        // rollback changes
        this.get('model').rollback();
      },
      submit: function(){
        var self = this;
        if(self.get('newWembed')){
          self.send('saveWembed', function(){
            self.send('savePost');
          });
        } else {
          self.send('savePost');
        }
      },
      saveWembed: function saveWembed(callback){
        var store = this.get('store');
        var self = this;

        store.find('user', App.currentUser.id)
        .then(function(user){

          var wembed = store.createRecord('wembed', self.get('newWembed'));
          wembed.setProperties({
            'creator': user
          });

          wembed.save().then(function(){
            self.set('model.wembed', wembed);
            callback();
          });

        });
      },
      savePost: function savePost(){
        var self = this;
        // // save the model edit
        this.get('model').save().then(function(){
          // updated!
          if(!self.isDestroyed){
            self.set('isEditing', false);
          }
        });
      },
      deleteItem: function(){
        var userConfirmation = confirm(Ember.I18n.t('post.delete.confirm'));
        if (userConfirmation === true) {
          var model = this.get('model');
          model.destroyRecord();
        }
      },
      loadAllComments: function(){
        var self = this;
        this.store.find('comment',{
          post: this.get('id'),
          limit: 1000
        }).then(function(comments){
          if(comments){
            self.setProperties({
              'comments': comments,
              'loadedComments': comments.get('length'),
              'metadata.commentCount': comments.get('length')
            });
          }
        });
      },

      newComment: function newComment(commentNew){
        var store = this.get('store');
        var self = this;

        store.find('user', we.authenticatedUser.id)
        .then(function (user) {
          // create new comment on store
          var comment = store.createRecord('comment', commentNew);
          comment.setProperties({
            'creator': user,
            'post': self.get('model')
          });
          // save it
          comment.save();

          self.get('comments').pushObject(comment);
        });
      },

      showSharedWith: function showSharedWith() {
        console.warn('TODO! show shared with ...', this.get('shareWithUsers'), this.get('shareInGroups'));
      },
      onRemoveSalvedImage: function onRemoveSalvedImage(image) {
        if (image) {
          this.get('images').removeObject(image);
        }
      }
    }
  });
})(jQuery, Ember, App);