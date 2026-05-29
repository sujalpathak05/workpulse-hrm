const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'WorkPulse HRM',
  },
  logo: String,
  officeLocation: {
    latitude: {
      type: Number,
      default: 28.6139,
    },
    longitude: {
      type: Number,
      default: 77.2090,
    },
    address: String,
    radius: {
      type: Number,
      default: 100,
    },
  },
  workingHours: {
    shiftStart: { type: String, default: '09:00' },
    shiftEnd: { type: String, default: '18:00' },
    lateMarkAfter: { type: Number, default: 15 },
  },
  workingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  leavePolicy: {
    sickLeavePerYear: { type: Number, default: 12 },
    casualLeavePerYear: { type: Number, default: 12 },
    paidLeavePerYear: { type: Number, default: 15 },
  },
  holidays: [
    {
      name: String,
      date: Date,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
