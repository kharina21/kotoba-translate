import express from 'express';
const router = express.Router();
import { register, login, getMe, updateAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

export default router;
