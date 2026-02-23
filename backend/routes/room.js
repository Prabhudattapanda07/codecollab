const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRoom,
  joinRoom,
  saveCode,
  loadCode,
  getMySavedCode
} = require('../controllers/roomController');

router.post('/create-room', protect, createRoom);
router.post('/join-room', protect, joinRoom);
router.get('/my-saved-code', protect, getMySavedCode);
router.post('/save-code', protect, saveCode);
router.get('/load-code/:roomId', protect, loadCode);

module.exports = router;
