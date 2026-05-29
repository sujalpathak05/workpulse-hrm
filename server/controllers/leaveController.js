const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');

const getDaysBetween = (from, to) => {
  const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff) + 1;
};

// @desc   Apply for leave
// @route  POST /api/leaves/apply
const applyLeave = async (req, res) => {
  const { leaveType, fromDate, toDate, reason } = req.body;

  const totalDays = getDaysBetween(fromDate, toDate);
  if (totalDays <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range.' });
  }

  // Check leave balance
  const user = await User.findById(req.user._id);
  const balanceKey = leaveType === 'paid' ? 'paid' : leaveType === 'sick' ? 'sick' : 'casual';

  if (['sick', 'casual', 'paid'].includes(leaveType)) {
    if (user.leaveBalance[balanceKey] < totalDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[balanceKey]} days.`,
      });
    }
  }

  // Check for overlapping leaves
  const overlap = await Leave.findOne({
    user: req.user._id,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } },
    ],
  });

  if (overlap) {
    return res.status(400).json({ success: false, message: 'Leave already applied for overlapping dates.' });
  }

  const leave = await Leave.create({
    user: req.user._id,
    leaveType,
    fromDate,
    toDate,
    totalDays,
    reason,
  });

  // Notify HR/Admin
  const admins = await User.find({ role: { $in: ['super_admin', 'hr_admin'] } });
  for (const admin of admins) {
    await sendNotification(
      admin._id,
      'New Leave Request',
      `${user.name} has applied for ${totalDays} day(s) ${leaveType} leave.`,
      'leave'
    );
  }

  res.status(201).json({ success: true, message: 'Leave applied successfully.', leave });
};

// @desc   Get my leaves
// @route  GET /api/leaves/me
const getMyLeaves = async (req, res) => {
  const { status, year } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;
  if (year) {
    query.fromDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const leaves = await Leave.find(query)
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  const user = await User.findById(req.user._id).select('leaveBalance');
  res.json({ success: true, leaves, leaveBalance: user.leaveBalance });
};

// @desc   Admin get all leave requests
// @route  GET /api/leaves
const getAllLeaves = async (req, res) => {
  const { status, leaveType, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (leaveType) query.leaveType = leaveType;

  const total = await Leave.countDocuments(query);
  const leaves = await Leave.find(query)
    .populate('user', 'name employeeId department profileImage')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, leaves });
};

// @desc   Approve or Reject leave
// @route  PUT /api/leaves/:id/action
const leaveAction = async (req, res) => {
  const { action, remark } = req.body;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action must be approved or rejected.' });
  }

  const leave = await Leave.findById(req.params.id).populate('user');
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave not found.' });
  }

  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Leave already processed.' });
  }

  leave.status = action;
  leave.approvedBy = req.user._id;
  leave.approvalRemark = remark;
  leave.approvedAt = new Date();
  await leave.save();

  if (action === 'approved') {
    // Deduct leave balance
    const balanceKey = leave.leaveType === 'paid' ? 'paid' : leave.leaveType === 'sick' ? 'sick' : 'casual';
    if (['sick', 'casual', 'paid'].includes(leave.leaveType)) {
      await User.findByIdAndUpdate(leave.user._id, {
        $inc: { [`leaveBalance.${balanceKey}`]: -leave.totalDays },
      });
    }

    // Mark attendance as on_leave for approved dates
    let current = new Date(leave.fromDate);
    const end = new Date(leave.toDate);
    while (current <= end) {
      const d = new Date(current);
      d.setHours(0, 0, 0, 0);
      await Attendance.findOneAndUpdate(
        { user: leave.user._id, date: d },
        { user: leave.user._id, date: d, status: 'on_leave' },
        { upsert: true }
      );
      current.setDate(current.getDate() + 1);
    }
  }

  await sendNotification(
    leave.user._id,
    `Leave ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    `Your ${leave.leaveType} leave from ${leave.fromDate.toDateString()} to ${leave.toDate.toDateString()} has been ${action}.${remark ? ` Remark: ${remark}` : ''}`,
    'leave'
  );

  res.json({ success: true, message: `Leave ${action} successfully.`, leave });
};

// @desc   Cancel leave (by employee)
// @route  PUT /api/leaves/:id/cancel
const cancelLeave = async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, user: req.user._id });
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave not found.' });
  }

  if (!['pending'].includes(leave.status)) {
    return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled.' });
  }

  leave.status = 'cancelled';
  await leave.save();

  res.json({ success: true, message: 'Leave cancelled.' });
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, leaveAction, cancelLeave };
