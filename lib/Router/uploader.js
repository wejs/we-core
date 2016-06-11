'use strict';

var multer = require('multer');
var uuid = require('node-uuid');

function defaultFilename(req, file, cb) {
  file.name = Date.now() + '_' + uuid.v1() + '.' + file.originalname.split('.').pop();
  cb(null, file.name);
}

var uploader = function getUploader(uploadConfigs) {
  return multer({
    storage: multer.diskStorage({
      destination: uploadConfigs.dest || uploadConfigs.destination,
      filename: uploadConfigs.filename || defaultFilename
    }),
    limits: uploadConfigs.limits,
    fileFilter: uploadConfigs.fileFilter
  }).fields(uploadConfigs.fields);
};

module.exports = uploader;