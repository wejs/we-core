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
  didInsertElement: function didInsertElement() {
    this.$().focus(function onFocusInput() {
      // move the cursor to end of editing text
      this.selectionStart = this.selectionEnd = this.value.length;
    });
    // trigger the focus
    this.$().focus();
  }
});
