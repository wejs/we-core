/**
 * Render page metadata tags
 *
 * {{{render-metadata-tags}}}
 */

module.exports = function(we) {
  return function renderMetadataTags() {
    var metatags = '';

    metatags += '<meta property="og:site_name" content="'+ we.config.appName +'">';

    if (this.title) {
      metatags += '<meta property="og:title" content="'+ this.title +'">';
    }

    if (this.metadata) {
      if (this.metadata.keywords) {
        metatags += '<meta name="keywords" content="'+ this.metadata.keywords +'">';
      } else if( we.config.appKeywords) {
        metatags += '<meta name="keywords" content="'+ we.config.appKeywords +'">';
      }

      if (this.metadata.description) {
        metatags += '<meta name="description" content="'+ this.metadata.description +'">';
        metatags += '<meta property="og:description" content="'+ this.metadata.description +'">';
      }

      if (this.metadata.image) {
        metatags += '<meta property="og:image" content="'+ this.metadata.image +'">';
      }

      if (this.url) {
        metatags += '<meta property="og:url" content="'+ this.url +'">';
      }

      if (this.metadata.type) {
        metatags += '<meta property="og:type" content="'+ this.metadata.type +'" />';
      }

      // application metatags
      metatags += '<meta property="application-name" content="'+ we.config.appName +'">';
      metatags += '<meta property="application-url" content="'+ we.config.hostname +'">';

    }

    return metatags;
  }
}