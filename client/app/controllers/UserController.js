  App.UserController = Ember.ObjectController.extend(App.UserSaveAttributeMixin, {
    queryParams: ['edit'],
    edit: null,

    breadCrumb: function(){
      var displayName = this.get('user.displayName');
      if(displayName){
        return displayName;
      }
      return null;
    }.property('user.displayName'),

    defaultlanguages: [
      'pt-br',
      'en'
    ],
    init: function() {
      this._super();

      this.set('defaultlanguages', App.configs.locales);
    },

    showSocialActions: function(){
      if(this.get('user.id') == App.get('currentUser.id')){
        return false;
      }else{
        return true;
      }
    }.property('user.id'),

    imageUploadUrl: '/api/v1/images',
    changeAvatar: false,
    onNewAvatarSelected: function() {
      var files = this.get('user.avatarSelected');
      if (files && files[0]) {
        this.set('user.newAvatar', files[0]);

        var self = this;
        var reader = new FileReader();

        reader.onload = function (e) {
          // get local file src
          self.set('user.newAvatarSRC', e.target.result);
        };
        reader.readAsDataURL(files[0]);
      }
    }.observes('user.avatarSelected'),

    actions: {
      edit: function edit(){
        this.setProperties({
          'edit': true,
          'user.hasChangesToSave': true
        });
      },
      cancel: function edit(){
        this.set('edit', null);
      },
      save: function save(){
        var self = this;

        // do nothing if is already salved
        // if ( self.get('user.currentState.stateName') == 'root.loaded.saved' )
        //   return ;

        // save the model
        self.get('user').save().then(function(){
          // updated!
          self.setProperties({
            'edit': null,
            'user.hasChangesToSave': false
          });

        });
      },
      remove: function remove(){
        this.set('edit', null);
      },
      showAvatarChangeModal: function(){
        we.events.trigger('showAvatarChangeModal', {
          user: App.get('currentUser')
        });
      }
    }
  });