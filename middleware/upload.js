const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads papkalarini yaratish
const uploadsDir = 'uploads/';
const coversDir = 'uploads/covers/';
const contentsDir = 'uploads/contents/';

// Papkalar mavjud emasligini tekshirish
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);
if (!fs.existsSync(contentsDir)) fs.mkdirSync(contentsDir);

// Storage sozlamalari
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'cover_file') {
      cb(null, coversDir);
    } else if (file.fieldname === 'content_file') {
      cb(null, contentsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedFilename);
  }
});

// Fayl filtri
const fileFilter = (req, file, cb) => {
  if (!file.originalname) {
    return cb(new Error('Fayl tanlanmadi!'));
  }
  cb(null, true);
};

// Multer sozlamalari
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ✅ TO'G'RI EXPORT
const uploadClientFiles = upload.fields([
  { name: 'cover_file', maxCount: 1 },
  { name: 'content_file', maxCount: 1 }
]);

const uploadSingle = upload.single('file');

module.exports = {
  uploadClientFiles,
  uploadSingle
};