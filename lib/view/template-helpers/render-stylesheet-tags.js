/**
 * Render theme stylescheets
 *
 * usage: {{{render-stylesheet-tags}}}
 *
 */

module.exports = function(we, view) {
  return function renderStylesheetTags(location) {
    var tags = '';

    if (!location || typeof location || 'string') {
      location = 'header';
    }
    tags += view.assets.getAssetsHTML('css', location);

    if (location == 'header') {
        // render theme assets
      var files = [];
      files.push(
        '/public/theme/'+ view.themes[this.theme].name + view.themes[this.theme].configs.stylesheet
        .replace('files/public', '')
      );
      for (var i = 0; i < files.length; i++) {
        tags = tags + view.themeStylesheetTag(files[i]);
      }
    }

    return tags;
  }
}