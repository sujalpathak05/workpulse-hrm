const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, leaveAction, cancelLeave } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.post('/apply', protect, applyLeave);
router.get('/me', protect, getMyLeaves);
router.put('/:id/cancel', protect, cancelLeave);

router.get('/', protect, authorize('super_admin', 'hr_admin'), getAllLeaves);
router.put('/:id/action', protect, authorize('super_admin', 'hr_admin'), leaveAction);

module.exports = router;
