/**
 *  Render project javascript tags
 *
 * {{render-javascript-tags}}
 */

module.exports = function(we, themeEngine) {
  return function renderJavascriptTags() {
    var files;
    var tags = '';
    var translationsSet = false;

    if (we.env == 'prod') {
      if (this.isAdmin) {
        tags = tags + themeEngine.themeScriptTag( 'public/min/admin.production.js' );
      } else {
        tags = tags + themeEngine.themeScriptTag( 'public/min/production.js' );
      }
    } else {
      if (!this.isAdmin) {
        files = themeEngine.getProjectJsAssetsFiles();
        files.push('public/tpls.hbs.js');
      } else {
        files = themeEngine.getProjectAdminJsAssetsFiles();
        files.push('public/admin.tpls.hbs.js');
      }

      for (var i = 0; i < files.length; i++) {
        tags = tags + themeEngine.themeScriptTag(files[i]);

        if (!translationsSet && files[i] ==  'public/plugin/we-core/app/beforeAll/6_Ember.I18n.js') {
          // add translations after ember.js file
          tags = tags + themeEngine.themeScriptTag('api/v1/translations.js');
          translationsSet = true;
        }
      }
    }

    if (!translationsSet) tags = tags + themeEngine.themeScriptTag('api/v1/translations.js');

    return tags;
  }
}