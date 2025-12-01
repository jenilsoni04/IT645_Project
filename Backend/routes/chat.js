const express = require('express');
const router = express.Router();
const getChatUserList  = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');

router.get('/connections', auth, getChatUserList);

module.exports = router;
