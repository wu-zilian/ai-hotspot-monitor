import mongoose, { Document, Schema, Model } from 'mongoose';

interface IHotspot extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  source: string;
  url: string;
  timestamp: Date;
  isVerified: boolean;
  confidence: number;
  keywords: string[];
  analysis: {
    summary: string;
    reasons: string[];
  };
  isNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hotspotSchema = new Schema<IHotspot>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  keywords: [{
    type: String,
    trim: true
  }],
  analysis: {
    summary: String,
    reasons: [String]
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Hotspot: Model<IHotspot> = mongoose.model<IHotspot>('Hotspot', hotspotSchema);

export default Hotspot;
