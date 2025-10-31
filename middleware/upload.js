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

// Storage sozlamalari - Har bir fayl turi uchun alohida
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

// Fayl filtrini olib tashladik — istalgan fayl yuklanadi
const fileFilter = (req, file, cb) => {
  if (!file.originalname) {
    return cb(new Error('Fayl tanlanmadi!'));
  }
  cb(null, true); // cheklov yo‘q
};

// Multer sozlamalari
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: fileFilter
});

// Eksport - Turli variantlar
module.exports = upload;

// Ikkita faylni yuklash uchun
module.exports.uploadClientFiles = upload.fields([
  { name: 'cover_file', maxCount: 1 },
  { name: 'content_file', maxCount: 1 }
]);

// Bitta fayl uchun (eski funksionallik)
module.exports.uploadSingle = upload.single('file');
