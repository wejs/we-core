App.UserSaveAttributeMixin = Ember.Mixin.create({
  isLoading: false,
  modelName: 'user',

  actions: {
    saveAttribute: function saveAttribute(attr) {
      var self = this;
      var modelName = this.get('modelName');
      var record = self.get(modelName);

      self.set('isLoading', true);

      var value;

      var type = this.get('store').modelFor(modelName);
      var fieldConfig = type.metaForProperty(attr);

      if (fieldConfig.kind === 'belongsTo' ) {
        value = record.get(attr + '.id');
      } else if(fieldConfig.kind === 'hasMany') {
        return Ember.Logger.error('Save attribute dont has suport to save hasMany fields');
      } else {
        value = record.get(attr);
      }

      var url = '/api/v1/' + modelName + '/' + record.id;
      url += '/' + attr;

      $.ajax({
        type: 'POST',
        url: url,
        cache: false,
        data: JSON.stringify({
          value: value
        }),
        dataType: 'json', //Expected data format from server
        contentType: 'application/json'
      })
      .fail(function (jqXHR, textStatus, errorThrown){
        Ember.Logger.error(
          'Error on update ' + modelName + ' atribute', attr , modelName , errorThrown
        );
      })
      .always(function() {
        self.set('isLoading', false);
      });
    }
  }
});