/**
 *  Load wejs adapter and custom JSONSerializer
 *
 */

// add getMetaData function on model
DS.Model.reopen({
  getMetaData: function () {
    return this.get('_data.meta');
  }
});

/**
 * Add Accept in all request
 *
 */
$.ajaxPrefilter(function( options ) {
  if ( !options.beforeSend) {
    options.beforeSend = function (xhr) {
      xhr.setRequestHeader('Accept', 'application/json');

      // set auth token
      if (App.auth.token)
        xhr.setRequestHeader('Authorization','Bearer ' + App.auth.token);
    };
  }
});



Ember.$(document).ajaxSuccess(function(event, jqXHR) {
  if(!jqXHR.responseJSON || !jqXHR.responseJSON.meta) return;

  if (!Ember.isEmpty(jqXHR.responseJSON.meta.activity) )  {
     Ember.get(App.Activity, 'store')
    .pushPayload('activity', {activity: jqXHR.responseJSON.meta.activity} );
    delete jqXHR.responseJSON.meta.activity;
  }
});

App.ApplicationRESTAdapter = DS.RESTAdapter.extend({
  defaultSerializer: '-default',
  pathForType: function(type) {
    var camelized = Ember.String.camelize(type);
    return Ember.String.singularize(camelized);
  }
});


App.ApplicationAdapter = App.ApplicationRESTAdapter;

// TODO mode to other file and load as requirejs module
//App.ApplicationSerializer = DS.JSONSerializer.extend({
App.ApplicationSerializer = DS.RESTSerializer.extend({
  /*
    @method serializeIntoHash
    @param {Object} hash
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {Object} options
  */
  serializeIntoHash: function(hash, type, record, options) {
    Ember.merge(hash, this.serialize(record, options));
  },

  typeForRoot: function(key) {
    if (key === 'messages') return key;

    return Ember.String.camelize(Ember.Inflector.inflector.singularize(key));
  },
});