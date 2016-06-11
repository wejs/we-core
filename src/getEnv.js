/**
 * Environment variable prod | dev | test
 *
 * @type {String}
 */

module.exports = function getEnv() {
  let env

  // check in process.arg
  if (process.argv.includes('--dev')) {
    env = 'dev';
  } else if (process.argv.includes('--test')) {
    env = 'test';
  } else if (process.argv.includes('--prod')) {
    env = 'prod';
  }

  if (!env) {
    switch (process.env.NODE_ENV) {
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

  return ( env || 'dev' );
};