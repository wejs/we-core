// enable ember.js query params
window.ENV = {FEATURES: {'query-params-new': true}};
Ember.FEATURES['query-params-new'] = true;

Ember.WeApplication = Ember.Application.extend({
  // authenticated user
  currentUser: {},

  configs: Ember.Object.create({
    vocabularyId: 1,
    imageUploadUrl: '/api/v1/images',
    wembedApiUrl: '',
    locale: 'pt-br',

    permissionHost: ''
  }),

  // ember application reary event
  ready: function () {
    this.set('WeNotification', window.WeNotification.create());

    // dev configs
    if ( !window.PRODUCTION_ENV ) {
      // basic logging of successful transitions
      this.set('LOG_TRANSITIONS', true);
      // detailed logging of all routing steps
      this.set('LOG_TRANSITIONS_INTERNAL', true);
      this.set('LOG_VIEW_LOOKUPS', true);
    }
  },

  activate: function() {
    var cssClass = this.toCssClass();
    // you probably don't need the application class
    // to be added to the body
    if (cssClass !== 'application') {
      Ember.$('body').addClass(cssClass);
    }
  },
  deactivate: function() {
    Ember.$('body').removeClass(this.toCssClass());
  },
  toCssClass: function() {
    return this.routeName.replace(/\./g, '-').dasherize();
  }
});
