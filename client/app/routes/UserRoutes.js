
  // Map user routers
  App.Router.map(function(match) {
    // user route map
    this.resource('users',{path: '/user'}, function(){
      // item route
      this.resource('user',{ path: '/:user_id' }, function(){
        // edit item route
        this.route('contacts');
        // edit item route
        this.route('images');
        // edit item route
        this.route('edit');
      });
    });
  });

  // route list
  // App.UsersRoute = Ember.Route.extend({
  //   // after change route
  // });
  // route list
  App.UsersIndexRoute = Ember.Route.extend(App.ResetScrollMixin,{
    model: function() {
      return this.store.find('user');
    }
  });

  // route /user/:uid/
  App.UserRoute = Ember.Route.extend({
    queryParams: {
      edit: {}
    },
    model: function(params) {
      var store = this.store;
      // get the user
      var hash = {
        user: this.store.find('user', params.user_id)
      };

      // get contact relation
      if(App.currentUser.id === params.user_id){
        hash.contact = { status: 'currentUser' };
      } else if(App.currentUser.id) {

        hash.contact = new Ember.RSVP.Promise(function(resolve) {
          Ember.$.ajax({
            type: 'GET',
            url: '/api/v1/user/'+params.user_id+'/contact',
            dataType: 'json',
            contentType: 'application/json'
          }).done(function(data){
            if(data.contact){
              delete data.meta;
              resolve( store.pushPayload(data) );
            }else{
              resolve( Ember.Object.create({status: ''}) );
            }
          }).fail(function(){
            resolve({});
          });
        });
      }else{
        hash.contact = {};
      }
      return Ember.RSVP.hash(hash);
    },

    actions: {
      follow: function(model, modelId) {

        window.FollowFlagObject.follow(model, modelId, this.get('store'));
      },

      unFollow: function(model, modelId, flagId){

        window.FollowFlagObject.unFollow(model, modelId, flagId, this.get('store'));
      }
    }
  });

  // route /user/:uid/index
  App.UserIndexRoute = Ember.Route.extend(App.ResetScrollMixin,{
    model: function() {
      return Ember.RSVP.hash({
        user: this.modelFor('user').user
      });
    }
  });

  // route /user/:uid/images
  App.UserImagesRoute = Ember.Route.extend({
    model: function() {
      var user_id = this.modelFor('user').user.get('id');
      return {
        user: this.modelFor('user'),
        // images load data filter
        loadData: this.load(user_id),
        // images dinamic filter
        images: this.get('store').filter('image', function(image) {
          if(image.get('creator.id') == user_id){
            return true;
          }else{
            return false;
          }
        })
      };
    },
    load: function(user_id){
      return this.store.find('image',{
        creator: user_id
      });
    }
  });

  // route /user/:uid/contact
  App.UserContactRoute = Ember.Route.extend({
    model: function() {
      return {
        user: this.modelFor('user')
      };
    },
  });

  // route item /edit
  App.UserEditRoute = Ember.Route.extend({
    renderTemplate: function() {
      this.render('user/edit');
    }
  });
