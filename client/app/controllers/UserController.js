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

      we.events.on('contact:requested', this.onCreateContact.bind(this));
     // we.events.on('sails:contact:accepted', this.onUpdateContact.bind(this));
      we.events.on('sails:deleted:contact', this.onDeleteContact.bind(this));
    },

    onCreateContact: function (message) {
      var userId = this.get('user.id');
      if (message.data.to === userId || message.data.from === userId) {
        this.set('contact', this.get('store').push('contact',message.data));
      }
    },
    // onUpdateContact: function (message) {
    //   console.warn('onUpdateContact>>>:', message);
    // },

    onDeleteContact: function (message) {
      var userId = this.get('user.id');
      if (message.data.to === userId || message.data.from === userId) {
        this.set('contact.status', '');
      }
    },

    willDestroy: function () {
      we.events.off('contact:requested', this.onCreateContact);
      //we.events.off('sails:updated:contact', this.onUpdateContact);
      we.events.off('sails:deleted:contact', this.onDeleteContact);
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

      contactButtomClicked: function() {
        switch(this.get('contact.currentUserStatus')){
          case 'requested':
            // TODO!
            this.send('cancelContactRequest');
            break;
          case 'requestsToYou':
            this.send('acceptAddInContactList');
            break;
          case 'accepted':
            this.send('deleteContact');
            break;
          case 'ignored':
            this.send('deleteContact');
            break;
          default:
            this.send('requestAddInContactList');
        }
      },
      requestAddInContactList: function(){
        var self = this;

        Ember.$.post('/api/v1/user/'+this.get('user.id')+'/contact-request')
        .done(function(data) {
          console.warn('contact',data.contact);
          self.set('contact',self.get('store').push('contact',data.contact));
          FollowObject.follow(
            'user',
            self.get('user.id'),
            self.get('store')
          ).then(function(flag){
            // self.set('flag',flag);
            // self.set('isLoading', false);
          });
        })
        .fail(function(data) {
           Ember.Logger.error('Error on requestAddInContactList contact:',data.contact);
        });

      },
      acceptAddInContactList: function(){
        var self = this;

        Ember.$.post('/api/v1/user/'+this.get('user.id')+'/contact-accept')
        .done(function(data) {
          self.set('contact.status',data.contact.status);
          FollowObject.follow(
            'user',
            self.get('user.id'),
            self.get('store')
          ).then(function(flag){
            // self.set('flag',flag);
            // self.set('isLoading', false);
          });

        })
        .fail(function(data) {

           Ember.Logger.error('Error on acceptAddInContactList contact:',data);
        });
      },

      ignoreContact: function(){
        var self = this;

        Ember.$.post('/api/v1/user/'+this.get('user.id')+'/contact-ignore')
        .done(function(data) {
          console.warn('ignoreContact',data.contact);
          self.set('contact.status',data.contact.status);
        })
        .fail(function(data) {
           Ember.Logger.error('Error on ignoreContact contact:',data);
        });

      },
      deleteContact: function(){
        var self = this;

        if(confirm('Tem certeza que deseja canselar a amizade com o '+
          this.get('user.displayName') + ' ?')
        ){
          Ember.$.ajax({
            url: '/api/v1/user/'+this.get('user.id')+'/contact/',
            type: 'DELETE'
          })
          .done(function(data) {
            console.warn('ignoreContact',data.contact);
          })
          .fail(function(data) {
             Ember.Logger.error('Error on deleteContact:',data);
          });
        }

      },
      showAvatarChangeModal: function(){
        we.events.trigger('showAvatarChangeModal', {
          user: App.get('currentUser')
        });
      }
    }
  });