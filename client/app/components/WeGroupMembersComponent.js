App.inject( 'component:we-group-members', 'store', 'store:main' );

App.WeGroupMembersComponent = Ember.Component.extend({
  classNames: ['group-members-list', 'widget'],

  isLoading: true,

  widgetTitle: 'group.members.widget.title',
  title: null,

  widgetSubtitle: 'group.members.widget.subtitle',
  subtitle: null,

  limit: 9,

  groupId: null,

  members: [],

  roleNames: null,
  roles: function() {
    if (!this.get('roleNames')) return null;
    return this.get('roleNames').split(';');
  }.property('roleNames'),

  willInsertElement: function() {
    if (this.get('widgetTitle')) this.set('title', Ember.I18n.t( this.get('widgetTitle') ));
    if (this.get('widgetSubtitle')) this.set('subtitle', Ember.I18n.t( this.get('widgetSubtitle') ));
  },

  loadMembers: function() {
    if (!this.get('groupId')) return;

    var self = this;
    var where = null;

    Ember.$.ajax({
      url: '/group/'+ this.get('groupId') +'/member',
      data: {
        where: where,
        limit: this.get('limit'),
        roleNames: this.get('roles')
      }
    }).done(function(data) {
      self.set('members', self.get('store').pushMany('membership', data.membership) );
    })
    .fail(function(xhr) {
      Ember.Logger.error(xhr);
    })
    .always(function() {
      self.set('isLoading', false);
    });
  }.observes('groupId').on('init')

});