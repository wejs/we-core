/* globals Pikaday */

App.DateFieldComponent = Ember.Component.extend({
  tagName: 'input',
  attributeBindings: ['readonly', 'placeholder'],
  format: 'DD/MM/YYYY',
  
  setupPikaday: function() {
    var that = this;

    var options = {
      field: this.$()[0],
      onSelect: function() {
        Ember.run(function() {
          that.userSelectedDate();
        });
      },
      firstDay: 1,
      format: this.get('format'),
      minDate: new Date('1900', '01', '01'),
      yearRange: [1900,2015]
    };

    if (this.get('i18n')) {
      options.i18n = this.get('i18n');
    }

    var pikaday = new Pikaday(options);

    this.set('pikaday', pikaday);
    this.get('pikaday').setDate(this.get('value'), true);
  }.on('didInsertElement'),

  teardownPikaday: function() {
    this.get('pikaday').destroy();
  }.on('willDestroyElement'),

  userSelectedDate: function() {
    this.set('value', this.get('pikaday').getDate());
  },

  setDate: function() {
    this.get('pikaday').setDate(this.get('value'), true);
  }.observes('value')
});