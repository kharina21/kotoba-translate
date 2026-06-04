import express from 'express';
const router = express.Router();
import { getDecks, getPublicDecks, getDeckById, createDeck, updateDeck, deleteDeck } from '../controllers/deckController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

router.get('/public', getPublicDecks);
router.get('/', protect, getDecks);
router.get('/:id', optionalProtect, getDeckById);
router.post('/', protect, upload.single('coverImage'), createDeck);
router.put('/:id', protect, upload.single('coverImage'), updateDeck);
router.delete('/:id', protect, deleteDeck);

export default router;
