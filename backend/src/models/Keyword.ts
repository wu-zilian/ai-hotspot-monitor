import mongoose, { Document, Schema, Model } from 'mongoose';

interface IKeyword extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const keywordSchema = new Schema<IKeyword>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Keyword: Model<IKeyword> = mongoose.model<IKeyword>('Keyword', keywordSchema);

export default Keyword;