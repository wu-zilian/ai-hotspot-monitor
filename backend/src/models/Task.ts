import mongoose, { Document, Schema, Model } from 'mongoose';

interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  schedule: string; // cron表达式，如 '*/30 * * * *' 表示每30分钟
  keywords: string[];
  isActive: boolean;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  schedule: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date
  }
}, {
  timestamps: true
});

const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);

export default Task;
