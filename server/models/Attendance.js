const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    ip: String,
    device: String,
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'on_leave', 'rejected', 'holiday'],
    default: 'absent',
  },
  workHours: {
    type: Number,
    default: 0,
  },
  isLate: {
    type: Boolean,
    default: false,
  },
  lateMinutes: {
    type: Number,
    default: 0,
  },
  remarks: String,
  distanceFromOffice: Number,
  locationVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Ek user ek din mein sirf ek record
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
