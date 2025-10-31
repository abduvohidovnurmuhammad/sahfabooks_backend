
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads papkalarini yaratish
const uploadsDir = 'uploads/';
const coversDir = 'uploads/covers/';
const contentsDir = 'uploads/contents/';

// Papkalar mavjud emasligini tekshirish
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir);
}
if (!fs.existsSync(contentsDir)) {
  fs.mkdirSync(contentsDir);
}

// Storage sozlamalari - Har bir fayl turi uchun alohida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Fieldname'ga qarab papka tanlash
    if (file.fieldname === 'cover_file') {
      cb(null, coversDir);
    } else if (file.fieldname === 'content_file') {
      cb(null, contentsDir);
    } else {
      cb(null, uploadsDir); // Default
    }
  },
  filename: function (req, file, cb) {
    // Unique fayl nomi yaratish
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedFilename);
  }
});

// Fayl filtri - rasm va hujjat formatlari
const fileFilter = (req, file, cb) => {
  // Cover file uchun - faqat rasmlar
  if (file.fieldname === 'cover_file') {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Muqova uchun faqat rasm fayllar (JPG, PNG, GIF, WEBP) qabul qilinadi!'));
    }
  }
  
  // Content file uchun - hujjat va rasm formatlari
  if (file.fieldname === 'content_file') {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Tarkib uchun faqat PDF, DOC, DOCX, JPG, PNG fayllar qabul qilinadi!'));
    }
  }

  // Eski 'file' field uchun - barcha formatlar
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Faqat PDF, DOC, DOCX, JPG, PNG fayllar qabul qilinadi!'));
  }
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