module.exports = function unhandledErrorCatcher(we) {
  process.on('unhandledRejection', error => {
    we.log.warn('unhandledRejection catch', {
      error: error
    });
  });
};