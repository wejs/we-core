/**
 * Render theme stylescheets
 *
 * usage: {{{render-stylesheet-tags}}}
 *
 */

module.exports = function(we, themeEngine) {
  return function renderStylesheetTags() {
    var tags = '';

    if (we.env == 'prod') {
      if (this.isAdmin) {
        tags = tags + themeEngine.themeStylesheetTag( '/public/min/admin.production.css' );
      } else {
        tags = tags + themeEngine.themeStylesheetTag( '/public/min/production.css' );
      }

    } else {
      var files = [];

      if (!we.config.disableCoreCssApp)
        files.push('/public/plugin/we-core/files/css/app.css');

      if (this.isAdmin) {
        files.push(
          '/public/theme/'+ themeEngine.themes.admin.name +'/'+ themeEngine.themes.admin.config.stylesheet
          .replace('files/public', '')
        )
      } else {
        files.push(
          '/public/theme/'+ themeEngine.themes.app.name + themeEngine.themes.app.config.stylesheet
          .replace('files/public', '')
        )
      }

      for (var i = 0; i < files.length; i++) {
        tags = tags + themeEngine.themeStylesheetTag(files[i]);
      }
    }


    return tags;
  }
}