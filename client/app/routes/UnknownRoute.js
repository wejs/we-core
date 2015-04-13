App.UnknownRoute = Ember.Route.extend({
	renderTemplate: function() {
	  this.render('404');
	},

  model: function() {
    var self = this;
    $.ajax({
      url: location.pathname
    }).done(function (data) {
      var keys = Object.keys(data);
      var modelName;

      for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i] != 'meta') {
          modelName = keys[i];
          break;
        }
      }

      if (!modelName) return;

      self.transitionTo(modelName, data[modelName].id);

    });
  }
});
