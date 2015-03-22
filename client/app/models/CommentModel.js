
App.Comment = DS.Model.extend({
  body: DS.attr('string'),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  // flags
  active: DS.attr('boolean', {
    defaultValue: true
  }),

  modelName: DS.attr('string'),
  modelId: DS.attr('string'),

  // relationship s
  creator:  DS.belongsTo('user', {async: true}),

  activities: DS.hasMany('activity', {async: true}),

  // creatorId: function() {
  //   return this.get('creator.id');
  // }.property('creator')
});

App.CommentAdapter = App.ApplicationRESTAdapter.extend();
