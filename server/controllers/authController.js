const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const CompanySettings = require('../models/CompanySettings');

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
  }

  // Track login info
  user.lastLogin = new Date();
  user.lastLoginIP = req.ip;
  user.deviceInfo = req.headers['user-agent'];
  await user.save();

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      profileImage: user.profileImage,
      leaveBalance: user.leaveBalance,
    },
  });
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
};

// @desc   Change password
// @route  PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully.' });
};

// @desc   Super Admin - Create first admin on setup
// @route  POST /api/auth/setup
const setupAdmin = async (req, res) => {
  const count = await User.countDocuments();
  if (count > 0) {
    return res.status(400).json({ success: false, message: 'System already set up.' });
  }

  const { name, email, password, companyName, officeLat, officeLon } = req.body;

  const admin = await User.create({
    name,
    email,
    password,
    role: 'super_admin',
  });

  await CompanySettings.create({
    companyName: companyName || 'WorkPulse HRM',
    officeLocation: {
      latitude: officeLat || 28.6139,
      longitude: officeLon || 77.2090,
      radius: 100,
    },
  });

  const token = generateToken(admin._id, admin.role);
  res.status(201).json({ success: true, token, message: 'Admin account created successfully.' });
};

module.exports = { login, getMe, changePassword, setupAdmin };
