const Notification = require('../models/Notification');

// @desc   Get my notifications
// @route  GET /api/notifications
const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.json({ success: true, notifications, unreadCount });
};

// @desc   Mark all as read
// @route  PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
};

// @desc   Mark single as read
// @route  PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
};

module.exports = { getNotifications, markAllRead, markRead };
