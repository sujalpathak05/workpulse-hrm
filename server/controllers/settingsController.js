const CompanySettings = require('../models/CompanySettings');

// @desc   Get company settings
// @route  GET /api/settings
const getSettings = async (req, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({});
  }
  res.json({ success: true, settings });
};

// @desc   Update company settings
// @route  PUT /api/settings
const updateSettings = async (req, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = new CompanySettings();
  }

  const {
    companyName, officeLocation, workingHours, workingDays, leavePolicy, holidays,
  } = req.body;

  if (companyName) settings.companyName = companyName;
  if (officeLocation) settings.officeLocation = { ...settings.officeLocation, ...officeLocation };
  if (workingHours) settings.workingHours = { ...settings.workingHours, ...workingHours };
  if (workingDays) settings.workingDays = workingDays;
  if (leavePolicy) settings.leavePolicy = { ...settings.leavePolicy, ...leavePolicy };
  if (holidays) settings.holidays = holidays;

  await settings.save();
  res.json({ success: true, message: 'Settings updated.', settings });
};

module.exports = { getSettings, updateSettings };
