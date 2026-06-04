import express from 'express';
const router = express.Router();
import { getFolders, getFolderById, createFolder, updateFolder, deleteFolder } from '../controllers/folderController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect); // All folder routes are private

router.get('/', getFolders);
router.get('/:id', getFolderById);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
