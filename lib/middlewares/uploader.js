var multer = require('multer');

var uploader = function getUploader(uploadConfigs) {
  return multer( uploadConfigs );
}

module.exports = uploader;