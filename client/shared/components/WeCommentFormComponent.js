
App.inject( 'component:we-comment-form', 'store', 'store:main' );

App.WeCommentFormComponent = Ember.Component.extend({
  //vars
  tagName: 'form',

  isOpenComentTextarea: false,

  commentedModelName: null,
  commentedModelId: null,

  // comment body
  body: '',

  userId: null,

  currentUser: function() {
    return App.currentUser;
  }.property('App.currentUser'),

  auth: function() {
    return App.auth;
  }.property('App.auth'),

  init: function() {
    this._super();

    if (!this.get('userId')) {
      this.set('userId' , App.get('currentUser.id') );
    }
  },

  actions: {
    sendComment: function(){
      var self = this;
      var commentNew = {};

      var modelName  = this.get('commentedModelName');
      var modelId  = this.get('commentedModelId');

      commentNew.body = this.get('body');
      // set some default values
      commentNew.createdAt = new Date();
      commentNew.updatedAt = commentNew.createdAt;

      this.sendAction('newComment',commentNew);
      // close the comment form
      this.send('closeComentTextarea');

      var user = this.store.getById('user',this.get('userId') );

      // create new comment on store
      var comment = this.get('store')
        .createRecord('comment', commentNew);

      comment.setProperties({
        'creatorId': user.id,
        'creator': user,
        'modelName': modelName,
        'modelId': modelId
      });

      // save it
      comment.save().then(function () {
        // clear comment body
        self.set('body', '');
      });
    },
    openComentTextarea: function(){
      var self = this;
      // open the textarea
      this.set('isOpenComentTextarea', true);
      // set focus on textarea on open
      this.$('textarea').focus();

      setTimeout(function() {
        if (self.$('textarea').atwho) {
          self.$('textarea').atwho({
            at: '@',
            data: App.currentUser.get('mentionOptions'),
          });
        }
      }, 100);
    },
    closeComentTextarea: function(){
     // close and clear sharebox form inputs
      this.setProperties({
        'body': '',
        'isOpenComentTextarea': false
      });
    }
  }
});
