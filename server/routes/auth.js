const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, setupAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/setup', setupAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
