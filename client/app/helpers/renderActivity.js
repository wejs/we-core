Ember.Handlebars.registerHelper('renderActivity', function(activityActionName, activityName, options) {
  var component1 = Ember.Handlebars.get(this, activityActionName, options);
  var helper = Ember.Handlebars.resolveHelper(options.data.view.container, component1);

  if (!helper) {
    var component2 = Ember.Handlebars.get(this, activityName, options);
    helper = Ember.Handlebars.resolveHelper(options.data.view.container, component2);
    if (!helper) {
      console.warn('Activity component not found', component1, component2);
      return '';
    }
  }
  helper.call(this, options);
});