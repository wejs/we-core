/**
 * Render page metadata tags
 *
 * {{{render-metadata-tags}}}
 */

module.exports = function() {
  return function renderMetadataTags() {
    return '<meta charset="UTF-8">'+this.metatag;
  }
}