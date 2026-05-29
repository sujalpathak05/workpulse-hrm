const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const sendNotification = require('../utils/sendNotification');

// Cloudinary optional — agar credentials nahi hain to upload skip
let cloudinary = null;
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
    cloudinary = require('../config/cloudinary');
  }
} catch (e) {}

const uploadToCloud = async (filePath, folder) => {
  if (!cloudinary) throw new Error('Cloudinary not configured. Please add CLOUDINARY credentials in .env');
  return cloudinary.uploader.upload(filePath, { folder, resource_type: 'auto' });
};

// @desc   Create new employee
// @route  POST /api/employees
const createEmployee = async (req, res) => {
  const {
    name, email, password, phone, department, designation,
    salary, shiftStart, shiftEnd, joiningDate, emergencyContact, address,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Employee with this email already exists.' });
  }

  const employee = await User.create({
    name, email, password: password || 'WorkPulse@123',
    phone, department, designation, salary,
    shiftStart, shiftEnd, joiningDate, emergencyContact, address,
    role: 'employee',
    createdBy: req.user._id,
  });

  await sendNotification(
    employee._id,
    'Welcome to WorkPulse HRM!',
    `Hello ${employee.name}, your account has been created. Employee ID: ${employee.employeeId}`,
    'general'
  );

  res.status(201).json({
    success: true,
    message: 'Employee created successfully.',
    employee: {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
    },
  });
};

// @desc   Get all employees
// @route  GET /api/employees
const getAllEmployees = async (req, res) => {
  const { department, search, page = 1, limit = 10 } = req.query;
  const query = { role: { $in: ['employee', 'hr_admin'] }, isActive: true };

  if (department) query.department = department;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const employees = await User.find(query)
    .select('-password -documents')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    employees,
  });
};

// @desc   Get single employee
// @route  GET /api/employees/:id
const getEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id).select('-password');
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }
  res.json({ success: true, employee });
};

// @desc   Update employee
// @route  PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'department', 'designation', 'salary',
    'shiftStart', 'shiftEnd', 'emergencyContact', 'address', 'isActive',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const employee = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  res.json({ success: true, message: 'Employee updated.', employee });
};

// @desc   Update own profile (Employee)
// @route  PUT /api/employees/profile
const updateProfile = async (req, res) => {
  const allowedFields = ['phone', 'address', 'emergencyContact'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json({ success: true, message: 'Profile updated.', user });
};

// @desc   Upload profile image
// @route  POST /api/employees/profile-image
const uploadProfileImage = async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ success: false, message: 'No image uploaded.' });
  }

  const file = req.files.image;
  const result = await uploadToCloud(file.tempFilePath, 'workpulse/profiles');

  await User.findByIdAndUpdate(req.user._id, { profileImage: result.secure_url });
  res.json({ success: true, imageUrl: result.secure_url });
};

// @desc   Upload employee document
// @route  POST /api/employees/documents
const uploadDocument = async (req, res) => {
  if (!req.files || !req.files.document) {
    return res.status(400).json({ success: false, message: 'No document uploaded.' });
  }

  const { docType, docName } = req.body;
  const file = req.files.document;

  const result = await uploadToCloud(file.tempFilePath, 'workpulse/documents');

  const userId = req.params.id || req.user._id;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        documents: {
          docType,
          docName,
          fileUrl: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  ).select('documents');

  res.json({ success: true, message: 'Document uploaded.', documents: user.documents });
};

// @desc   Verify document (Admin)
// @route  PUT /api/employees/:empId/documents/:docId/verify
const verifyDocument = async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.empId, 'documents._id': req.params.docId },
    { $set: { 'documents.$.verified': true } },
    { new: true }
  ).select('documents');

  res.json({ success: true, message: 'Document verified.', documents: user.documents });
};

// @desc   Get employee stats for admin dashboard
// @route  GET /api/employees/stats
const getEmployeeStats = async (req, res) => {
  const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
  const departments = await User.aggregate([
    { $match: { role: 'employee', isActive: true } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPresent = await Attendance.countDocuments({
    date: today,
    status: { $in: ['present', 'late', 'half_day'] },
  });

  const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

  res.json({
    success: true,
    stats: {
      totalEmployees,
      todayPresent,
      todayAbsent: totalEmployees - todayPresent,
      pendingLeaves,
      departments,
    },
  });
};

// @desc   Admin reset employee password
// @route  PUT /api/employees/:id/reset-password
const resetEmployeePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const employee = await User.findById(req.params.id).select('+password');
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  employee.password = newPassword;
  await employee.save();

  await sendNotification(
    employee._id,
    'Password Reset',
    'Your login password has been reset by admin. Please login with your new password.',
    'alert'
  );

  res.json({ success: true, message: `Password reset successfully for ${employee.name}.` });
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  updateProfile,
  uploadProfileImage,
  uploadDocument,
  verifyDocument,
  getEmployeeStats,
  resetEmployeePassword,
};
