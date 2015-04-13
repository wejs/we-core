var crypto = require('crypto');
var Chancejs = require('chance');
// Instantiate Chance so it can be used
var chancejs = new Chancejs();

var stubs = {};

stubs.getImageFilePath = function getImageFilePath() {
  return __dirname + '/image.png';
}

stubs.userStub = function userStub() {
  var randString = crypto.randomBytes(20).toString('hex');
  return {
    displayName: chancejs.name(),
    username: randString.slice(0,15),
    fullName: chancejs.name(),
    biography: chancejs.paragraph({sentences: 5}),
    email:  chancejs.email(),
    password: '123',
    language: 'pt-br',
    active: true,
    gender: 'M',
    cpf: chancejs.cpf()
  }
}

stubs.imageDataStub = function imageDataStub() {
  return {
     label: null,
     description: null,
     name: '1425876319846_16e2b060-c617-11e4-97e6-cd9dacd7f0ff.png',
     size: 11152,
     encoding: '7bit',
     active: true,
     originalname: 'image.png',
     mime: 'image/png',
     extension: 'png',
     width: '289',
     height: '264'
   }
}

stubs.pageStub = function pageStub(userId) {
  return {
    creatorId : userId,
    title: chancejs.sentence({words: 4}),
    about: chancejs.paragraph({sentences: 3}),
    body: chancejs.paragraph({sentences: 5}),
    tags: [
      'Futebol',
      'Jogo',
      'Jogador'
    ],
    categories: [
      'Saúde',
      'Entreterimento'
    ]
  }
}

stubs.groupStub = function groupStub(userId) {
  return {
    creatorId : userId,
    name: chancejs.sentence({words: 4}),
    description: chancejs.paragraph({sentences: 5}),
    tags: [
      'Futebol',
      'Jogo',
      'Jogador'
    ],
    categories: [
      'Saúde',
      'Entreterimento'
    ]
  }
}

stubs.commentStub = function commentStub(userId, modelName, recortToComment) {
  return {
    creatorId : userId,
    modelId: recortToComment.id,
    modelName: modelName,
    body: chancejs.paragraph({sentences: 5})
  }
}

stubs.vocabularyStub = function vocabularyStub(userId) {
  return {
    creatorId : userId,
    name: chancejs.word(),
    description: chancejs.paragraph({sentences: 5})
  }
}

stubs.termsStub = function termsStub(userId, vocabularyId) {
  return [
    {
      text: 'Saúde',
      description: chancejs.paragraph({sentences: 5}),
      vocabularyId: vocabularyId
    },
    {
      text: chancejs.word(),
      description: chancejs.paragraph({sentences: 5}),
      vocabularyId: vocabularyId
    },
    {
      text: 'Universe',
      description: chancejs.paragraph({sentences: 5}),
      vocabularyId: vocabularyId
    }
  ]
}

module.exports = stubs;