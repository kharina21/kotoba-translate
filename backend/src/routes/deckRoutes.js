const express = require('express');
const router = express.Router();
const { getDecks, getPublicDecks, getDeckById, createDeck, updateDeck, deleteDeck } = require('../controllers/deckController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/public', getPublicDecks);
router.get('/', protect, getDecks);
router.get('/:id', optionalProtect, getDeckById);
router.post('/', protect, upload.single('coverImage'), createDeck);
router.put('/:id', protect, upload.single('coverImage'), updateDeck);
router.delete('/:id', protect, deleteDeck);

module.exports = router;
