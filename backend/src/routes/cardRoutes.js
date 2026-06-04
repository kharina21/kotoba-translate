import express from 'express';
const router = express.Router();
import { getCardsByDeck, createCard, updateCard, deleteCard, generateAICards, saveAICards } from '../controllers/cardController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

router.get('/deck/:deckId', optionalProtect, getCardsByDeck);
router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.delete('/:id', protect, deleteCard);
router.post('/ai/generate', protect, generateAICards);
router.post('/ai/save', protect, saveAICards);

export default router;
