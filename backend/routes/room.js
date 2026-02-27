const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRoom,
  joinRoom,
  saveCode,
  loadCode,
  getMySavedCode,
  deleteRoom
} = require('../controllers/roomController');

router.post('/create-room', protect, createRoom);
router.post('/join-room', protect, joinRoom);
router.get('/my-saved-code', protect, getMySavedCode);
router.post('/save-code', protect, saveCode);
router.get('/load-code/:roomId', protect, loadCode);
router.delete('/delete-room/:roomId', protect, deleteRoom);

module.exports = router;
