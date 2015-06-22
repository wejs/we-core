/**
 *  Render project javascript tags
 *
 * {{{render-javascript-tags}}}
 */

module.exports = function(we, view) {
  return function renderJavascriptTags(location) {
    var tags = '';

    if (!location || typeof location !== 'string') {
      location = 'footer';
    }
    tags += view.assets.getAssetsHTML('js', location);

    if (location == 'footer') {
        // render theme assets
      var files = [];
      files.push(
        '/public/theme/'+ view.themes[this.theme].name + view.themes[this.theme].configs.javascript
        .replace('files/public', '')
      );

      if (this.locale !== 'en' || this.locale !== 'en-us') {
        files.push('/public/plugin/we-core/files/summernote/lang/summernote-'+this.locale+'.js');
      }

      for (var i = 0; i < files.length; i++) {
        tags = tags + view.themeScriptTag(files[i]);
      }


    }

    return tags;
  }
}