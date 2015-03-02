
  App.ContactButtomView = Ember.View.extend(App.LoggedInMixin, {
    template: Ember.Handlebars.compile('<span class="glyphicon glyphicon-plus"></span> {{view.label}}'),
    tagName: 'button',
    classNames: ['btn','btn-xs','btn-default'],
    label: function(){
      switch(this.get('contactStatus')){
        case 'requested':
          return Ember.I18n.t('contact.button.requested');
        case 'requestsToYou':
          return Ember.I18n.t('contact.button.requestsToYou');
        case 'accepted':
          return Ember.I18n.t('contact.button.accepted');
        case 'ignored':
        case 'currentUser':
          return '';
        default:
          return Ember.I18n.t('contact.button.add');
      }
    }.property('contactStatus'),
    disabled: function(){
      switch(this.get('contactStatus')){
        // case 'requestsToYou':
        // case 'accepted':
        //   return null;
        case 'requested':
        case 'ignored':
        case 'currentUser':
          return 'disabled';
        default:
          return null;
      }

    }.property('contactStatus'),
    attributeBindings: ['contact','disabled'],
    click: function(){
      this.get('controller').send('contactButtomClicked');
    }
  });


