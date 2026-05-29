const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  checkIn: {
    time: Date,
    location: { latitude: Number, longitude: Number },
    ip: String,
    device: String,
  },
  checkOut: {
    time: Date,
    location: { latitude: Number, longitude: Number },
  },
  duration: { type: Number, default: 0 }, // hours
}, { _id: true });

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
  sessions: [sessionSchema], // Multiple check-in/out sessions
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'],
    default: 'absent',
  },
  totalWorkHours: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  distanceFromOffice: Number,
  locationVerified: { type: Boolean, default: false },
  remarks: String,
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
