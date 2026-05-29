const express = require('express');
const router = express.Router();
const {
  createEmployee, getAllEmployees, getEmployee, updateEmployee,
  updateProfile, uploadProfileImage, uploadDocument, verifyDocument, getEmployeeStats,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes
router.get('/stats', protect, authorize('super_admin', 'hr_admin'), getEmployeeStats);
router.post('/', protect, authorize('super_admin', 'hr_admin'), createEmployee);
router.get('/', protect, authorize('super_admin', 'hr_admin'), getAllEmployees);
router.get('/:id', protect, getEmployee);
router.put('/:id', protect, authorize('super_admin', 'hr_admin'), updateEmployee);
router.put('/:empId/documents/:docId/verify', protect, authorize('super_admin', 'hr_admin'), verifyDocument);
router.post('/:id/documents', protect, authorize('super_admin', 'hr_admin'), uploadDocument);

// Employee self routes
router.put('/profile/me', protect, updateProfile);
router.post('/profile/image', protect, uploadProfileImage);
router.post('/documents/upload', protect, uploadDocument);

module.exports = router;
