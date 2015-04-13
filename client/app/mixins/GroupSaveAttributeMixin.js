App.GroupSaveAttributeMixin = Ember.Mixin.create({
  isLoading: false,
  actions: {
    saveAttribute: function saveAttribute(atributo) {
      var self = this;
      var group = self.get('group');

      self.set('isLoading', true);

      var value;

      var type = this.get('store').modelFor('group');
      var fieldConfig = type.metaForProperty(atributo);

      if (fieldConfig.kind === 'belongsTo' ) {
        value = group.get(atributo + '.id');
      } else if(fieldConfig.kind === 'hasMany') {
        return Ember.Logger.error('Save attribute dont has suport to save hasMany fields');
      } else {
        value = group.get(atributo);
      }

      var url = '/api/v1/group/' + group.id;
      url += '/' + atributo;

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
      .fail(function( jqXHR, textStatus, errorThrown){
        Ember.Logger.error('Error on update group atribute',atributo,errorThrown);
      })
      .always(function() {
        self.set('isLoading', false);
      });
    }
  }
});