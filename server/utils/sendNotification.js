const Notification = require('../models/Notification');

const sendNotification = async (recipientId, title, message, type = 'general', link = '') => {
  try {
    await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
    });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

module.exports = sendNotification;
