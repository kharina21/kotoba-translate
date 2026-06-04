const express = require('express');
const router = express.Router();
const { getCardsByDeck, createCard, updateCard, deleteCard, generateAICards, saveAICards } = require('../controllers/cardController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.get('/deck/:deckId', optionalProtect, getCardsByDeck);
router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.delete('/:id', protect, deleteCard);
router.post('/ai/generate', protect, generateAICards);
router.post('/ai/save', protect, saveAICards);

module.exports = router;
