/**
 * Focus Input field
 *
 * This field set focus after inserted in DOM
 *
 * Usage:
 *   {{focus-input value=yourValue}}
 *
 */

App.FocusInputComponent = Ember.TextField.extend({

	init: function () {
		// body...
		this._super.apply(this, arguments);

		if (this.get('type') != 'checkbox' && this.get('limit')) {
			this.addObserver('value', this, this.countCharacters);
		}
	},

	didInsertElement: function () {
		this.countCharacters();

    this.$().focus(function onFocusInput() {
      // move the cursor to end of editing text
      this.selectionStart = this.selectionEnd = this.value.length;
    });
    // trigger the focus

    this.$().focus();
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
