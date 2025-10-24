const multer = require('multer');
const path = require('path');

// Storage sozlamalari
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Fayllar saqlanadigan papka
  },
  filename: function (req, file, cb) {
    // Unique fayl nomi yaratish
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Fayl filtri (faqat PDF, DOC, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
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

module.exports = upload;