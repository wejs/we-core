
App.Messages = DS.Model.extend({
  message: DS.attr('string'),
  status: DS.attr('string'),
  extraData: DS.attr()
});

App.MessagesSerializer = DS.RESTSerializer.extend({
  typeForRoot: function(key) {
    return key;
  }
});
