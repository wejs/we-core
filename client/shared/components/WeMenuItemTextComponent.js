App.WeMenuItemTextComponent = Ember.Component.extend({
  item: null,
  tagName: 'span',

  text: function() {
  	if (this.get('item.i18nText')) {
	    return Ember.I18n.t(this.get('item.i18nText'));
  	} else {
			return this.get('item.text');
  	}
  }.property('item.i18nTextr', 'item.text')
});
