const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const { isWithinRadius } = require('../utils/geoLocation');
const sendNotification = require('../utils/sendNotification');

const getTodayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWorkHours = (checkIn, checkOut) => {
  const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
  return Math.round(diff * 100) / 100;
};

// @desc   Check In
// @route  POST /api/attendance/checkin
const checkIn = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Location access required for attendance.' });
  }

  const today = getTodayDate();
  const existing = await Attendance.findOne({ user: req.user._id, date: today });

  if (existing && existing.checkIn?.time) {
    return res.status(400).json({ success: false, message: 'You have already checked in today.' });
  }

  const settings = await CompanySettings.findOne();
  const officeLat = settings?.officeLocation?.latitude || parseFloat(process.env.OFFICE_LATITUDE);
  const officeLon = settings?.officeLocation?.longitude || parseFloat(process.env.OFFICE_LONGITUDE);
  const officeRadius = settings?.officeLocation?.radius || parseInt(process.env.OFFICE_RADIUS) || 100;

  const { isValid, distance } = isWithinRadius(latitude, longitude, officeLat, officeLon, officeRadius);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: `Attendance rejected. You are ${distance}m away from office. Required: within ${officeRadius}m.`,
      distance,
    });
  }

  // Late check
  const shiftStart = req.user.shiftStart || settings?.workingHours?.shiftStart || '09:00';
  const [shiftHour, shiftMin] = shiftStart.split(':').map(Number);
  const lateMarkAfter = settings?.workingHours?.lateMarkAfter || 15;

  const now = new Date();
  const shiftStartTime = new Date();
  shiftStartTime.setHours(shiftHour, shiftMin + lateMarkAfter, 0, 0);

  const isLate = now > shiftStartTime;
  const lateMinutes = isLate ? Math.round((now - shiftStartTime) / 60000) : 0;

  const attendance = await Attendance.findOneAndUpdate(
    { user: req.user._id, date: today },
    {
      user: req.user._id,
      date: today,
      checkIn: {
        time: now,
        location: { latitude, longitude },
        ip: req.ip,
        device: req.headers['user-agent'],
      },
      status: isLate ? 'late' : 'present',
      isLate,
      lateMinutes,
      distanceFromOffice: distance,
      locationVerified: true,
    },
    { upsert: true, new: true }
  );

  if (isLate) {
    await sendNotification(
      req.user._id,
      'Late Arrival Marked',
      `You checked in ${lateMinutes} minutes late today.`,
      'attendance'
    );
  }

  res.json({
    success: true,
    message: isLate ? `Checked in successfully. Marked as LATE (${lateMinutes} mins).` : 'Checked in successfully. Present!',
    attendance,
  });
};

// @desc   Check Out
// @route  POST /api/attendance/checkout
const checkOut = async (req, res) => {
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ user: req.user._id, date: today });

  if (!attendance || !attendance.checkIn?.time) {
    return res.status(400).json({ success: false, message: 'You have not checked in today.' });
  }

  if (attendance.checkOut?.time) {
    return res.status(400).json({ success: false, message: 'You have already checked out.' });
  }

  const now = new Date();
  const workHours = getWorkHours(attendance.checkIn.time, now);

  const { latitude, longitude } = req.body;
  attendance.checkOut = {
    time: now,
    location: { latitude, longitude },
  };
  attendance.workHours = workHours;

  if (workHours < 4) {
    attendance.status = 'half_day';
  }

  await attendance.save();

  res.json({
    success: true,
    message: `Checked out. Work hours today: ${workHours}h`,
    attendance,
  });
};

// @desc   Get my attendance
// @route  GET /api/attendance/me
const getMyAttendance = async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
  const targetYear = parseInt(year) || currentDate.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const records = await Attendance.find({
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const summary = {
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
    halfDay: records.filter((r) => r.status === 'half_day').length,
    onLeave: records.filter((r) => r.status === 'on_leave').length,
    totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(2),
  };

  res.json({ success: true, records, summary });
};

// @desc   Get today's status
// @route  GET /api/attendance/today
const getTodayStatus = async (req, res) => {
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ user: req.user._id, date: today });

  res.json({
    success: true,
    attendance: attendance || null,
    hasCheckedIn: !!(attendance?.checkIn?.time),
    hasCheckedOut: !!(attendance?.checkOut?.time),
  });
};

// @desc   Admin - Get all employees attendance
// @route  GET /api/attendance/admin
const getAdminAttendance = async (req, res) => {
  const { date, department, employeeId } = req.query;
  const targetDate = date ? new Date(date) : getTodayDate();

  const matchQuery = { date: targetDate };
  if (employeeId) matchQuery.user = employeeId;

  const records = await Attendance.find(matchQuery)
    .populate('user', 'name employeeId department designation profileImage')
    .sort({ 'checkIn.time': 1 });

  res.json({ success: true, date: targetDate, records });
};

// @desc   Get attendance report
// @route  GET /api/attendance/report
const getAttendanceReport = async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  const query = {
    date: {
      $gte: new Date(startDate || new Date().setDate(1)),
      $lte: new Date(endDate || new Date()),
    },
  };
  if (userId) query.user = userId;

  const records = await Attendance.find(query)
    .populate('user', 'name employeeId department')
    .sort({ date: -1, 'user.name': 1 });

  res.json({ success: true, records, total: records.length });
};

// @desc   Admin manual attendance entry
// @route  POST /api/attendance/manual
const manualAttendance = async (req, res) => {
  const { userId, date, status, remarks } = req.body;

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOneAndUpdate(
    { user: userId, date: targetDate },
    { user: userId, date: targetDate, status, remarks },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Attendance updated manually.', attendance });
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getAdminAttendance,
  getAttendanceReport,
  manualAttendance,
};
