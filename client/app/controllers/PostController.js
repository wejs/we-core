
App.PostController = Ember.ObjectController.extend(
App.WembedLinkerMixin,
App.PostMecanismMixin,
{
  queryParams: ['anchor'],
  anchor: null,

  breadCrumb: function(){
    return this.get('post.id');
  }.property('post.id'),

  isEditing: false,
  loadedComments: 4,

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
    var store = this.get('store');
    this.set('wembed', store.createRecord('wembed', this.get('newWembed')))
  }.observes('newWembed'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser'),

  actions: {
    deleteComment: function(comment){
      // confirm delete action
      var userConfirmation = confirm( window.i18n('comment.delete.confirm') );
      if (userConfirmation === true) {
        // delete comment from database
        comment.destroyRecord()
        .catch(function onError(result){
          Ember.Logger.error('Error on delete comment', result);
        });
      }
    },
    edit: function() {
      this.set('post.isEditing', true);
    },
    cancel: function() {
      this.set('post.isEditing', false);
      // rollback changes
      this.get('post').rollback();
    },
    submit: function(){
      var self = this;
      if(self.get('wembed.wembedId')){
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

        var wembed = self.get('wembed');
        wembed.setProperties({
          'creator': user
        });

        wembed.save().then(function(){
          self.set('post.wembed', wembed);
          callback();
        });

      });
    },
    savePost: function savePost(){
      var self = this;
      // // save the model edit
      this.get('post').save().then(function(){
        // updated!
        if(!self.isDestroyed){
          self.set('post.isEditing', false);
        }
      });
    },
    deleteItem: function(){
      var userConfirmation = confirm(window.i18n('comment.delete.confirm'));
      if (userConfirmation === true) {
        var model = this.get('post');
        // send delete post event
        this.send('postDeleted', model);

        model.deleteRecord();
        model.save()
        .catch(function onError(result){
          Ember.Logger.error('Error on create comment', result);
        });
      }
    },

    newComment: function newComment(commentNew){
      var store = this.get('store');
      var self = this;

      store.find('user', we.authenticatedUser.id)
      .then(function(user) {
        // create new comment on store
        var comment = store.createRecord('comment', commentNew);
        comment.setProperties({
          'creator': user,
          'post': self.get('post'),
          'postId': self.get('post.id')
        });
        // save it
        comment.save().then(function () {
          // reset post Id for filters
          comment.set('postId', self.get('post.id'));
        });
      });
    },

    onRemoveSalvedImage: function onRemoveSalvedImage(image) {
      if (image) {
        this.get('images').removeObject(image);
      }
    }
  }
});
