module.exports = {

  compileAssets: [
    'clean:dev',
    'copy',
    'weThemeEmberHandlebars',
    'fileindex',
    'fileindex'
  ],

  build: [
    'compileAssets',
    'concat',
    //'cssmin',
    'uglify',
    'clean:afterProdBuild'
  ],
  
  dev: [
    'compileAssets',
    'watch'
  ],

  'default': [
    'dev'
  ]
}