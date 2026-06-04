const express = require('express');
const router = express.Router();
const { getFolders, getFolderById, createFolder, updateFolder, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All folder routes are private

router.get('/', getFolders);
router.get('/:id', getFolderById);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

module.exports = router;
