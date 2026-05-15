const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './public/uploads/cv',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.showRegister);
router.post('/register', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'passport_photo', maxCount: 1 }
]), authController.registerUser);

router.get('/login', authController.showLogin);
router.post('/login', authController.loginUser);

router.get('/logout', authController.logoutUser);

module.exports = router;