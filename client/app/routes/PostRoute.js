
App.Router.map(function(match) {
  // post route map
  this.resource('posts',{path: '/post'}, function(){
    // item route
    this.resource('post',{
      path: '/:post_id',
      //queryParams: ['anchor']
    }, function(){

    });
  });

});

App.PostsIndexRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function() {
    return Ember.RSVP.hash({
      posts: this.store.find('post'),
      postNew: App.postClean(),
      isSearching: '',
      postIsLoading: false
    });
  },
  actions: {
    // action before post delete
    postDeleted: function(){},

    //action after post creation
    newPost: function(){},

    // -- SEARCH
    searchRecords: function(query){

      var self  = this;
      var store = this.get('store');

      App.set('postIsLoading', true);

      // reset posts and comments in store
      this.store.unloadAll('post');
      this.store.unloadAll('comment');

      self.set('page', 1);

      if(!query){
        return store.find('post').then(function(){
          self.set('currentModel.postIsLoading', false);
        });
      }

      store.find('post', query).then(function(){
        self.set('currentModel.postIsLoading', false);
      });
    }
  }
});

// route item
App.PostRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function (params) {
    var self = this;
    // preload all comments
    this.store.find('comment',{
      post: params.post_id,
      limit: 1000
    });

    return Ember.RSVP.hash({
      // get current comment
      post: this.store.find('post', params.post_id).then(function(post) {
        self.subscribe('post', post.id);
        return post;
      }),
      // user filter to live update on new comments
      commentsList: this.store.filter('comment', function(resource) {
        if (resource.get('postId') == params.post_id) {
          return true;
        }
        return false;
      })
    })
  },
  afterModel: function(model) {
    App.WeNotification.markModelNotificationAsRead(
      this.get('store'), 'post', model.post.id
    )
  },

  subscribe: function(modelName, id) {
    window.io.socket.post('/api/v1/subscribe',{
      modelName: modelName,
      ids: [
        id
      ]
    });
  }
});

App.PostsRoute = Ember.Route.extend({
  model: function() {
    return []
  }
});