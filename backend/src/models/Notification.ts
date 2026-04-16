import mongoose, { Document, Schema, Model } from 'mongoose';

interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  hotspotId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
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
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  hotspotId: {
    type: Schema.Types.ObjectId,
    ref: 'Hotspot'
  },
}, {
  timestamps: true
});

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
