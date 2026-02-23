const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { executeCode } = require('../controllers/codeController');

router.post('/execute-code', protect, executeCode);

module.exports = router;
