const express = require('express');
const router = express.Router();
const {
  checkIn, checkOut, getMyAttendance, getTodayStatus,
  getAdminAttendance, getAttendanceReport, manualAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Employee routes
router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/me', protect, getMyAttendance);
router.get('/today', protect, getTodayStatus);

// Admin routes
router.get('/admin', protect, authorize('super_admin', 'hr_admin'), getAdminAttendance);
router.get('/report', protect, authorize('super_admin', 'hr_admin'), getAttendanceReport);
router.post('/manual', protect, authorize('super_admin', 'hr_admin'), manualAttendance);

module.exports = router;
