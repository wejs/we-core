
App.HomeRoute = Ember.Route.extend({
  // renderTemplate: function() {
  //   this.render('home');
  // },
  model: function() {
    return Ember.RSVP.hash({
      // posts: this.store.find('post'),
      postNew: App.postClean(),
      isSearching: '123'
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
          App.set('postIsLoading', false);
        });
      }

      store.find('post', query).then(function(){
        App.set('postIsLoading', false);
      });
    }
  }
});
