App.inject( 'component:we-group-join-button', 'store', 'store:main' );

App.WeGroupJoinButtonComponent = Ember.Component.extend({
  layout: Ember.Handlebars.compile('{{icon}}{{{view.label}}}'),

  tagName: 'button',

  icon: '',

  group: null,
  isLoading: true,

  attributeBindings: ['disabled'],

  disabled: function() {
    if (this.get('group.isCreator')) return true;
    return null;
  }.property('group.isCreator'),

  classNameBindings: ['status','disabled:disabled' ],

  status: function() {
    if (!this.get('group.id')) return;
    if(this.get('isLoading')) this.set('isLoading', false);
    return this.get('group.membership.status');
  }.property('group.membership.status'),

  label: function() {
    if (this.get('isLoading')) return Ember.I18n.t('membership.button.loading');

    switch(this.get('status')) {
      case 'invited':
        return Ember.I18n.t('membership.button.invited');
      case 'active':
        return Ember.I18n.t('membership.button.active');
      case 'requested':
        this.set('disabled', true);
        return Ember.I18n.t('membership.button.requested');
      // case 'blocked':
      default:
        return Ember.I18n.t('membership.button.request');
    }
  }.property('status', 'isLoading'),

  click: function(){
    this.send('changeMembership');
  },


  actions: {
    changeMembership: function changeMembership() {
      if (this.get('group.isCreator')) {
        // TODO group creator cant leave the group
        return;
      }
      var membership = this.get('status');
      switch(membership){
        case 'invited':
          return this.send('acceptGroup');
        case 'active':
          return this.send('leaveGroup');
        case 'blocked':
            break;
        // case 'requested':
        //     break;
        default:
          return this.send('joinGroup');
      }
    },
    joinGroup: function joinGroup() {
      var self = this;
      var group = this.get('group');
      var userId = App.get('currentUser.id');
      if(!userId) return Ember.Logger.error('App.currentUser.id not found in joinGroup');

      $.post('/api/v1/group/' + group.id + '/join')
      .done(function (response) {
        self.set('group.data.meta.membership', response.membership);
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function (e) {
        console.error('Error on join group' , e);
      });
    },

    leaveGroup: function leaveGroup() {
      var self = this;
      var group = this.get('group');
      var userId = App.get('currentUser.id');

      if(!userId) return Ember.Logger.error('App.currentUser.id not found in leaveGroup');

      return $.post('/api/v1/group/' + group.id + '/leave')
      .done(function () {
        // remove membership status from group and model
        self.set('group.data.meta.membership', null);
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function(e){
        Ember.Logger.error('Error on leave group' , e);
      });
    },

    acceptGroup: function acceptGroup() {
      var self = this;
      var store = this.get('store');
      var group = this.get('group');
      var userId = App.get('currentUser.id');
      var membership = this.get('membership');

      if(!userId) return Ember.Logger.error('App.currentUser.id not found in leaveGroup');

      $.get('/comunidade/' + group.id + '/invite/' + membership.id)
      .done(function (membership) {
        self.set('membership', store.push('membership', membership));
        group.set('_data.meta.membership', membership);
        // Manha para setar atualização no status de membro
        // TODO - Relacionar com o Ember.model 'Membership'
        group.set('updatedAt', new Date());
      }).fail(function(e){
        console.error('Error on join group' , e);
      });

    }
  }
});