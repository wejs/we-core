/**
 * Render theme stylescheets
 *
 * usage: {{{render-stylesheet-tags}}}
 *
 */

module.exports = function(we, view) {
  return function renderStylesheetTags() {
    var tags = '';
    var themeName = this.theme;

    if (we.env == 'prod') {
      if (this.isAdmin) {
        tags = tags + view.themeStylesheetTag( '/public/min/admin.production.css' );
      } else {
        tags = tags + view.themeStylesheetTag( '/public/min/production.css' );
      }

    } else {
      var files = [];

      if (!we.config.disableCoreCssApp)
        files.push('/public/plugin/we-core/files/css/app.css');

      if (this.isAdmin) {
        files.push(
          '/public/theme/'+ view.themes[themeName].name +'/'+ view.themes[themeName].configs.stylesheet
          .replace('files/public', '')
        )
      } else {
        files.push(
          '/public/theme/'+ view.themes[themeName].name + view.themes[themeName].configs.stylesheet
          .replace('files/public', '')
        )
      }

      for (var i = 0; i < files.length; i++) {
        tags = tags + view.themeStylesheetTag(files[i]);
      }
    }


    return tags;
  }
}