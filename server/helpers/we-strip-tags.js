/**
 * Remove all tags from text and print it
 *
 * {{we-strip-tags text='' maxLength=170}}
 */

module.exports = function(we) {
  return function renderHelper() {
    var options = arguments[arguments.length-1];
    if (!options.hash.text) return '';

    var text = we.utils.string(options.hash.text).stripTags();

    if (options.hash.maxLength)
      text = text.truncate(options.hash.maxLength);

    return text.s;
  }
}