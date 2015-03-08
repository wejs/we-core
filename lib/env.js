/**
 * Env variable prod | dev | test
 * 
 * @type {String}
 */
var env = 'dev';

switch(process.env.NODE_ENV){
  case 'prod':
    env = 'prod';
    break;
  case 'test':
    env = 'test';        
    break;
}

module.exports = env;