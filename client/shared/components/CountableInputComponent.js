/**
 * Countable Input field
 *
 * This field set focus after inserted in DOM
 *
 * Usage:
 *   {{countable-input value=yourValue limit="140" trackCount=count}}
 *
 */

App.CountableInputComponent = Ember.TextField.extend({
	init: function () {
		// body...
		this._super.apply(this, arguments);

		if (this.get('type') != 'checkbox' && this.get('limit')) {
			this.addObserver('value', this, this.countCharacters);
		}
	},

	didInsertElement: function () {
		this.countCharacters();
	},

	countCharacters: function () {
		// body...
		if (!this.get('value')) {
			return this.set('trackCount', parseInt(this.get('limit')));
		}
		var diff = parseInt(this.get('limit')) - this.get('value').length;
		if (diff < 0) {
			this.set('value', this.get('value').substr(0, parseInt(this.get('limit'))));
			return this.set('trackCount', 0);
		}
		return this.set('trackCount', diff);
	}
});
