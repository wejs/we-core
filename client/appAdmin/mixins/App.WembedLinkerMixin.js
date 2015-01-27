
App.WembedLinkerMixin = Ember.Mixin.create({
  wembedApiUrl: 'http://wembed.wejs.org/api/v1/json?url=',
  oldLinks: [],
  currentLinkIndex: 0,
  links: [],
  wembedVariable: 'newWembed',
  isLoading: false,
  getLinkDataInWembed: function getLinkDataInWembed(link){
    return Ember.$.getJSON(this.wembedApiUrl+link);
  },

  /**
   * check if the text has links
   */
  getLinks: function getLinks(text){
    // remove &nbsp;
    // TODO move the replace to regex epression bellow
    text = text.replace('&nbsp;',' ');
    var expression =  /(https?:\/\/[^\s|<]+)/gi;
    return (text.match(expression));
  },

  checkLinks: function checkLinks(code){
    var self = this;
    var wembedVariableName = self.get('wembedVariable');

    console.warn('>>>', self.get(wembedVariableName),self.get('isLoading') )
    // if has one link selected skyp
    if (self.get(wembedVariableName) || self.get('isLoading') ) return;
    // store links list
    self.set('links', self.getLinks(code));

    var links = self.get('links');

    if (!links) return;

    self.set('isLoading', true);

    var currentLink = links[self.currentLinkIndex];
    var result = self.getLinkDataInWembed(currentLink);
    result.done(function onSuccess(data) {
      if (data.page) {
        data.page.wembedId = data.page.id;
        delete data.page.id;
        self.set(wembedVariableName, data.page);
      }
    })
    .fail(function onFail() {
      console.error('Error on get Wembed JSON! for link', currentLink);
    })
    .always(function onEnd() {
      self.set('isLoading', false);
    });
  }
});
