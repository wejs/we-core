/**
 * Env variable prod | dev | test
 *
 * @type {String}
 */
var env = 'dev';

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

module.exports = env;