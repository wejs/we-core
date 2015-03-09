var crypto = require('crypto');
var Chancejs = require('chance');
// Instantiate Chance so it can be used
var chancejs = new Chancejs();

var stubs = {};

stubs.getImageFilePath = function getImageFilePath() {
  return __dirname + '/image.png';
}

stubs.userStub = function() {
  var randString = crypto.randomBytes(20).toString('hex');
  return {
    displayName: chancejs.name(),
    username: randString.slice(0,15),
    fullName: chancejs.name(),
    biography: chancejs.paragraph({sentences: 5}),
    email:  chancejs.email(),
    password: '123',
    language: 'pt-br',
    active: false,
    gender: 'M',
    cpf: chancejs.cpf()
  }
}

module.exports = stubs;