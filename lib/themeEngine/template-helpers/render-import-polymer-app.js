/**
 * Render theme stylescheets
 *
 * usage: {{{render-stylesheet-tags}}}
 *
 */

module.exports = function(we) {
  return function renderImportPolymer() {
    var tag = '';

    if (we.env == 'prod') {
      if (this.isAdmin) {
        tag = '<link rel="import" href="/public/project/client/admin/prod.app.html">';
      } else {
        tag = '<link rel="import" href="/public/project/client/app/prod.app.html">';
      }
    } else {
      if (this.isAdmin) {
        tag = '<link rel="import" href="/public/project/client/admin/app.html">';
      } else {
        tag = '<link rel="import" href="/public/project/client/app/app.html">';
      }
    }

    return tag;
  }
}