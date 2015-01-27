/**
 * WeWysiwygEditorComponent editor html for we.js
 */

App.WeWysiwygEditorComponent = Ember.Component.extend({

  chageEventName: 'onChangeText',
  pasteEventName: 'onPasteText',

  editor: {},
  //onPaste: 'onPaste',
  tagName: 'div',
  //flags
  isLoading: false,

  // full | small | clean
  style: 'small',

  didInsertElement: function() {
    this._super();

    var self = this;
    // append summernote div tag for create the editor in it
    self.$().append('<div class="summernote">'+self.get('value')+'</div>');
    // set toobar buttons based on style config
    var toobar = [['font', ['bold', 'italic', 'underline', 'clear']]];
    if (self.get('style' ) == 'full' ) {
      toobar.push(['para', [ 'ul','ol' ]]);
      toobar.push(['style', ['style']]);
    } else if (self.get('style' ) == 'clean' ) {
      toobar = [];
    }

    var editorConfigs = {
      focus: true,
      styleWithSpan: false,
      toolbar: toobar,
      onblur: function() {
        self.set('value',editor.code());
      }
    };

    // make on change event optional
    if (this.get('onChangeText')) {
      editorConfigs.onkeyup = function onkeyup(e) {
        // on keyUp update the binded value variable
        self.set('value',editor.code());
        self.sendAction('chageEventName', editor, e);
      };
    }

    // make on paste event optional
    if (this.get('onPasteText')) {
      editorConfigs.onpaste = function onpaste() {
        self.sendAction('pasteEventName', editor );
      };
    }

    // create the editor
    var editor =  self.$('.summernote').summernote(editorConfigs);
    // get summernote visible editor
    var visibleEditor = editor.next().find('div.note-editable');

    // use at.js to add mention suport for text editor
    if (visibleEditor && visibleEditor.atwho) {
      visibleEditor.atwho({
        at: '@',
        data: App.currentUser.get('mentionOptions'),
      });
    }

    // salve editor on ember component variable
    this.set('editor', editor);
  },

  // on destroy remove the editor
  willDestroyElement: function() {
    this._super();
    this.get('editor').destroy();
  }

});
