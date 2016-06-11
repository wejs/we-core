/**
 * Simple function to test modelHooks feature
 */
module.exports = function setWananingoValue(record, options, done) {
  record.wananingo = true;

  done();
}