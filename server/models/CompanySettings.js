const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, default: 'Office' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: String,
  radius: { type: Number, default: 50 },
}, { _id: true });

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'WorkPulse HRM' },
  logo: String,

  // Multiple office locations support
  officeLocations: {
    type: [locationSchema],
    default: [
      { name: 'Office 1', latitude: 28.586923, longitude: 77.315355, radius: 50 },
      { name: 'Office 2', latitude: 28.599652, longitude: 77.339100, radius: 50 },
    ],
  },

  // Legacy single location (backward compat)
  officeLocation: {
    latitude: { type: Number, default: 28.599652 },
    longitude: { type: Number, default: 77.339100 },
    address: String,
    radius: { type: Number, default: 50 },
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
  holidays: [{ name: String, date: Date }],
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
