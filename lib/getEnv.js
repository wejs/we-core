/**
 * Env variable prod | dev | test
 *
 * Env is same of all projects in same
 *
 * @type {String}
 */


module.exports = function getEnv() {
  var env;

  // check in process.arg
  if (process.argv.indexOf('--dev') > -1) {
    env = 'dev';
  } else if (process.argv.indexOf('--test') > -1){
    env = 'test';
  } else if (process.argv.indexOf('--prod') > -1){
    env = 'prod';
  }

  if (!env) {
    switch(process.env.NODE_ENV){
      case 'production':
      case 'prod':
        env = 'prod';
        break;
      case 'test':
        env = 'test';
        break;
      case 'development':
      case 'dev':
        env = 'dev';
        break;
    }
  }

  return env || 'dev';
};