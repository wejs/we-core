
App.inject( 'component:we-flag', 'store', 'store:main' );

App.WeFlagComponent = Ember.Component.extend({

  tagName: 'button',
  classNameBindings: ['btnClass'],
  attributeBindings: ['disabled'],
  flagClass: 'btn btn-xs btn-default',
  unFlagClass: 'btn btn-xs btn-default active',

  flag: null,
  count: 0,

  timeToLoad: 3000,

  flagType: 'like',
  flagText: 'Like',
  unFlagText: null,
  isLoading: true,

  layout: Ember.Handlebars.compile('{{{showText}}} {{count}}'),

  disabled: function() {
    if( !App.get('auth.isAuthenticated') ) {
      return true;
    }
    return this.get('isLoading');
  }.property('isLoading', 'App.auth.isAuthenticated'),

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

    if (this.get('flagText') && Ember.isEmpty(this.get('unFlagText')) ) {
      this.set('unFlagText', this.get('flagText') )
    }

    if (!this.get('flag')) {


      var userId = App.currentUser.id;

      Ember.run.later(function(){
        if( self.isDestroyed ) {
          return;
        }

        FlagObject.isFlagged(
          self.get('flagType'),
          self.get('model'),
          self.get('modelId'),
          userId,
          self.get('store')
        ).then(function(record){

          if( self.isDestroyed ) {
            return;
          }

          self.set('isLoading', false);

          if( record.flag ) {
            self.set('flag',record.flag);
          }

          if( record.count ) {
            self.set('count', record.count);
          }

        });
      }, self.get('timeToLoad'));

    } else {
      self.set('isLoading', false);
    }
  },

  click: function() {
    if( !App.get('auth.isAuthenticated') ) return;

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

      FlagObject.flag(
        this.get('flagType'),
        this.get('model'),
        this.get('modelId'),
        this.get('store')
      ).then(function(result){
        self.set('flag',result);
        self.set('count', self.get('count') + 1 );
        self.set('isLoading', false);
      });
    },

    unFlag: function() {
      var self = this;

      var flagId = this.get('flag.id');
      self.set('isLoading', true);

      FlagObject.unFlag(
        this.get('flagType'),
        this.get('model'),
        this.get('modelId'),
        flagId,
        this.get('store')
      ).then(function(){
        self.set('flag',{});
        self.set('count', self.get('count') -1 );
        self.set('isLoading', false);
      });
    }
  }

});
