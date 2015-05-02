
// inject store on WeFollowComponent
App.inject( 'component:we-follow', 'store', 'store:main' );

App.WeFollowComponent = Ember.Component.extend(App.LoggedInMixin,{

  tagName: 'button',
  classNameBindings: ['btnClass'],
  attributeBindings: ['disabled'],
  flagClass: 'btn btn-xs btn-default',
  unFlagClass: 'btn btn-xs btn-default active',

  flag: null,
  flagText: 'Follow',
  unFlagText: null,
  isLoading: true,

  layout: Ember.Handlebars.compile('{{{showText}}}'),

  disabled: function(){
    return this.get('isLoading');
  }.property('isLoading'),

  btnClass: function(){
    if(this.get('flag.id')){
      return this.get('unFlagClass');
    } else {
      return this.get('flagClass');
    }
  }.property('flag.id','flagClass', 'unFlagClass'),

  showText: function() {
    if(this.get('flag.id')) {
      return this.get('unFlagText');
    } else {
      return this.get('flagText');
    }
  }.property('flag.id'),

  init: function(){
    this._super();
    var self = this;

    // dont show to not logged in users
    if( !App.get('auth.isAuthenticated')) {
      self.set('isVisible', false);
      return;
    }

    if (this.get('flagText') && Ember.isEmpty(this.get('unFlagText')) ) {
      this.set('unFlagText', this.get('flagText') )
    }

    if (!this.get('flag')) {

      var userId = App.currentUser.id;

      FollowObject.isFollowing(
        this.get('model'),
        this.get('modelId'),
        userId,
        this.get('store')
      ).then(function(record){
        self.set('flag',record);
        self.set('isLoading', false);
      });
    } else {
      self.set('isLoading', false);
    }
  },

  click: function(){
    if(this.get('flag.id')) {
      this.send('unFlag');
    } else {
      this.send('flag');
    }
  },

  actions: {
    flag: function() {
      var self = this;

      self.set('isLoading', true);

      FollowObject.follow(
        this.get('model'),
        this.get('modelId'),
        this.get('store')
      ).then(function(flag){
        self.set('flag',flag);
        self.set('isLoading', false);
      });
    },

    unFlag: function() {
      var self = this;

      var flagId = this.get('flag.id');
      self.set('isLoading', true);

      FollowObject.unFollow(
        this.get('model'),
        this.get('modelId'),
        flagId,
        this.get('store')
      ).then(function(){
        self.set('flag',{});
        self.set('isLoading', false);
      });
    }
  }

});
