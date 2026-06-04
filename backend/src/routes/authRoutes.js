const express = require('express');
const router = express.Router();
const { register, login, getMe, updateAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
