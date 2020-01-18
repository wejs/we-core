const multer = require('multer'),
      uuid = require('uuid');

function defaultFilename (req, file, cb) {
  file.name = Date.now() + '_' + uuid.v1() +'.'+ file.originalname.split('.').pop();
  cb(null, file.name);
}

function getUploader(uploadConfigs) {
  return multer({
    storage:  multer.diskStorage({
      destination: uploadConfigs.dest || uploadConfigs.destination,
      filename: uploadConfigs.filename || defaultFilename,
    }),
    limits: uploadConfigs.limits,
    fileFilter: uploadConfigs.fileFilter
  })
  .fields(uploadConfigs.fields);
}

module.exports = getUploader;