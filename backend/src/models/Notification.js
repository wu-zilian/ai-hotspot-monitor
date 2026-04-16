const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'error', 'info', 'hotspot'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  hotspotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotspot'
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
