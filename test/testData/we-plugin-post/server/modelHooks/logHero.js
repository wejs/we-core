/**
 * Simple function to test modelHooks feature
 */
module.exports = function logHeroModelHook(record, options, done) {
  this.we.log.info('Hero!', record.get());

  done();
}