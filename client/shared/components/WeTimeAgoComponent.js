App.WeTimeAgoComponent = Ember.Component.extend({
  tagName: 'span',

  text: null,
  date: null,

  updateEvery: 60000,

  scheduled: null,

  momentObj: null,

  didInsertElement: function() {
    this.updateTime();
  },

  willRemoveElement: function() {
    if (this.set('scheduled')) {
      clearTimeout(this.set('scheduled'));
    }
  },

  updateTime: function() {
    if (this.get('date')) {
      if (!this.get('momentObj')) {
        this.set('momentObj', moment(this.get('date')) );
      }

      this.set('text', this.get('momentObj').fromNow());

    } else {
      this.set('text', null);
    }

    this.set('scheduled',
      setTimeout( this.updateTime.bind(this), this.get('updateEvery'))
    );
  }
});