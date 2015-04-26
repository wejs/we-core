App.Router.map(function() {
  // groups route map
  this.resource('groups',{path: '/group'}, function(){
    this.route('create',{path: '/create'});
    // item route
    this.resource('group',{ path: '/:id' }, function(){
      this.route('addMember', {path: '/membros/add'});
      this.route('members', {path: '/members'});
      this.route('content', {path: '/content'});
      this.route('about', {path: '/about'});
      this.route('edit', {path: '/edit'});
      this.route('requests', {path: '/requests'});
    });
  });
});

// route list
App.GroupsIndexRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function() {
    // then return the list
    return this.store.find('group');
  }
});

App.GroupAddMemberRoute = Ember.Route.extend(App.ResetScrollMixin);

// route create
App.GroupsCreateRoute = Ember.Route.extend(App.ResetScrollMixin,{
  model: function() {
    return {
      image: {},
      record: {},
    };
  }
});

App.GroupRoute = Ember.Route.extend({
  model: function(params) {
    return Ember.RSVP.hash({
      group: this.store.find('group', params.id),
      roles: App.configs.groupRoles,
      membership: null
    });
  },
  afterModel: function(model) {
    var membership = Ember.get(model.group, '_data.meta.membership');
    if (membership) {
      model.membership = this.store.push('membership', membership);
    }
  }
});

// route /user/:uid/index
App.GroupIndexRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    var group = this.modelFor('group').group;
    return Ember.RSVP.hash({
      // set current group
      group: group
    });
  }
});

App.GroupAboutRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    return Ember.RSVP.hash({
      group: this.modelFor('group').group
    });
  }
});

App.GroupEditRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    return Ember.RSVP.hash({
      record: this.modelFor('group').group
    });
  }
});

// members list
App.GroupMembersRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    var group = Ember.get(this.modelFor('group'), 'group' );
    // then return the list
    return Ember.RSVP.hash({
      group: group,
      members: this.loadMembers(group.id, 20)
    })
  },

  loadMembers: function(groupId, limit, role) {
    var self = this;
    if (!groupId) groupId = this.get('group.id');

    if (!groupId) return;


    var query = {};
    // Só quem tem o status de ativo. Se for convite, o usuário ainda tem que aceitar...
    query.status = 'active';
    if (role) query.role = role;
    if (role) query.limit = limit;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      return $.ajax({
        type: 'GET',
        url: '/group/' + groupId + '/members',
        data:  query
      })
      .done(function success(data) {
        return resolve(self.get('store').pushMany('membership', data.user));
      })
      .fail(reject)
    });
  }
});

// members list
App.GroupRequestsRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    var group = Ember.get(this.modelFor('group'), 'group' );
    // then return the list
    return Ember.RSVP.hash({
      group: group,
      memberships: this.loadRequests(group.id)
    })
  },

  loadRequests: function(groupId) {
    var self = this;
    if (!groupId) groupId = this.get('group.id');

    if (!groupId) return;


    var query = {};
    // Só quem tem o status de requested
    query.status = 'requested';

    return new Ember.RSVP.Promise(function(resolve, reject) {
      return $.ajax({
        type: 'GET',
        url: '/api/v1/group/' + groupId + '/member',
        data:  query
      })
      .done(function success(data) {
        return resolve(data.membership);
      })
      .fail(reject)
    });
  }
});

App.GroupContentRoute = Ember.Route.extend(App.ResetScrollMixin, {
  model: function() {
    return Ember.RSVP.hash({
      group: this.modelFor('group').group
    });
  }
});
