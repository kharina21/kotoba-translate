import express from 'express';
const router = express.Router();
import { translateText } from '../controllers/translateController.js';

router.post('/', translateText);

export default router;
