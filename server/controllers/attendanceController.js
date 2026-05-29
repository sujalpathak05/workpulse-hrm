const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const { isWithinRadius } = require('../utils/geoLocation');
const sendNotification = require('../utils/sendNotification');

const getTodayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const calcHours = (checkIn, checkOut) =>
  Math.round(((new Date(checkOut) - new Date(checkIn)) / 3600000) * 100) / 100;

const calcTotalHours = (sessions) =>
  sessions.reduce((sum, s) => {
    if (s.checkIn?.time && s.checkOut?.time) {
      return sum + calcHours(s.checkIn.time, s.checkOut.time);
    }
    return sum;
  }, 0);

// @desc   Check In (multiple times allowed per day)
// @route  POST /api/attendance/checkin
const checkIn = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Location access required for attendance.' });
  }

  const settings = await CompanySettings.findOne();
  const officeLat = settings?.officeLocation?.latitude || parseFloat(process.env.OFFICE_LATITUDE);
  const officeLon = settings?.officeLocation?.longitude || parseFloat(process.env.OFFICE_LONGITUDE);
  const officeRadius = settings?.officeLocation?.radius || parseInt(process.env.OFFICE_RADIUS) || 50;

  const { isValid, distance } = isWithinRadius(latitude, longitude, officeLat, officeLon, officeRadius);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: `Attendance rejected! You are ${distance}m away from office. Required: within ${officeRadius}m.`,
      distance,
      required: officeRadius,
    });
  }

  const today = getTodayDate();
  let attendance = await Attendance.findOne({ user: req.user._id, date: today });

  // Check agar already active session hai (checkIn without checkOut)
  if (attendance) {
    const activeSession = attendance.sessions.find((s) => s.checkIn?.time && !s.checkOut?.time);
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in! Please check out first before checking in again.',
      });
    }
  }

  // Late check — sirf pehli baar
  const now = new Date();
  let isLate = false;
  let lateMinutes = 0;

  if (!attendance || attendance.sessions.length === 0) {
    const shiftStart = req.user.shiftStart || settings?.workingHours?.shiftStart || '09:00';
    const [shiftHour, shiftMin] = shiftStart.split(':').map(Number);
    const lateMarkAfter = settings?.workingHours?.lateMarkAfter || 15;

    const shiftStartTime = new Date();
    shiftStartTime.setHours(shiftHour, shiftMin + lateMarkAfter, 0, 0);

    isLate = now > shiftStartTime;
    lateMinutes = isLate ? Math.round((now - shiftStartTime) / 60000) : 0;
  }

  const newSession = {
    checkIn: {
      time: now,
      location: { latitude, longitude },
      ip: req.ip,
      device: req.headers['user-agent'],
    },
  };

  if (!attendance) {
    attendance = await Attendance.create({
      user: req.user._id,
      date: today,
      sessions: [newSession],
      status: isLate ? 'late' : 'present',
      isLate,
      lateMinutes,
      distanceFromOffice: distance,
      locationVerified: true,
    });
  } else {
    attendance.sessions.push(newSession);
    if (attendance.status === 'absent') {
      attendance.status = isLate ? 'late' : 'present';
      attendance.isLate = isLate;
      attendance.lateMinutes = lateMinutes;
    }
    attendance.distanceFromOffice = distance;
    attendance.locationVerified = true;
    await attendance.save();
  }

  const sessionNum = attendance.sessions.length;

  if (isLate && sessionNum === 1) {
    await sendNotification(
      req.user._id,
      'Late Arrival',
      `You checked in ${lateMinutes} minutes late today.`,
      'attendance'
    );
  }

  res.json({
    success: true,
    message: isLate && sessionNum === 1
      ? `Checked in (Session ${sessionNum}) — Marked LATE by ${lateMinutes} mins`
      : `Checked in successfully! (Session ${sessionNum})`,
    attendance,
    sessionNumber: sessionNum,
  });
};

// @desc   Check Out
// @route  POST /api/attendance/checkout
const checkOut = async (req, res) => {
  const { latitude, longitude } = req.body;
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ user: req.user._id, date: today });

  if (!attendance || attendance.sessions.length === 0) {
    return res.status(400).json({ success: false, message: 'You have not checked in today.' });
  }

  // Find active session (checkIn without checkOut)
  const activeIdx = attendance.sessions.findIndex((s) => s.checkIn?.time && !s.checkOut?.time);

  if (activeIdx === -1) {
    return res.status(400).json({
      success: false,
      message: 'No active session found. Please check in first.',
    });
  }

  const now = new Date();
  attendance.sessions[activeIdx].checkOut = {
    time: now,
    location: { latitude: latitude || null, longitude: longitude || null },
  };
  attendance.sessions[activeIdx].duration = calcHours(
    attendance.sessions[activeIdx].checkIn.time, now
  );

  // Total work hours recalculate
  attendance.totalWorkHours = Math.round(calcTotalHours(attendance.sessions) * 100) / 100;

  // Half day check
  if (attendance.totalWorkHours < 4 && attendance.status !== 'on_leave') {
    attendance.status = 'half_day';
  }

  await attendance.save();

  const sessionNum = activeIdx + 1;

  res.json({
    success: true,
    message: `Checked out! Session ${sessionNum} duration: ${attendance.sessions[activeIdx].duration}h | Total today: ${attendance.totalWorkHours}h`,
    attendance,
    sessionDuration: attendance.sessions[activeIdx].duration,
    totalWorkHours: attendance.totalWorkHours,
  });
};

// @desc   Get today's status
// @route  GET /api/attendance/today
const getTodayStatus = async (req, res) => {
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ user: req.user._id, date: today });

  const activeSession = attendance?.sessions?.find((s) => s.checkIn?.time && !s.checkOut?.time);

  res.json({
    success: true,
    attendance: attendance || null,
    hasCheckedIn: !!(activeSession),
    hasCheckedOut: !activeSession && !!(attendance?.sessions?.length > 0),
    isCurrentlyIn: !!(activeSession),
    totalSessions: attendance?.sessions?.length || 0,
    totalWorkHours: attendance?.totalWorkHours || 0,
  });
};

// @desc   Get my attendance history
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
    totalWorkHours: records.reduce((sum, r) => sum + (r.totalWorkHours || 0), 0).toFixed(2),
  };

  res.json({ success: true, records, summary });
};

// @desc   Admin — get all attendance for a date
// @route  GET /api/attendance/admin
const getAdminAttendance = async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : getTodayDate();
  targetDate.setHours(0, 0, 0, 0);

  const records = await Attendance.find({ date: targetDate })
    .populate('user', 'name employeeId department designation profileImage')
    .sort({ createdAt: 1 });

  res.json({ success: true, date: targetDate, records });
};

// @desc   Attendance report
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
    .sort({ date: -1 });

  res.json({ success: true, records, total: records.length });
};

// @desc   Manual attendance entry by admin
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

  res.json({ success: true, message: 'Attendance updated.', attendance });
};

module.exports = {
  checkIn, checkOut, getTodayStatus,
  getMyAttendance, getAdminAttendance,
  getAttendanceReport, manualAttendance,
};
