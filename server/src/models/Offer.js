import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Helper ID is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone/Event ID is required'],
      index: true,
    },
    skills: {
      type: [String],
      required: [true, 'At least one skill is required in an offer'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Must offer at least one skill',
      },
      index: true,
    },
    availabilityMinutes: {
      type: Number,
      required: [true, 'Availability window in minutes is required'],
      min: [15, 'Availability must be at least 15 minutes'],
      max: [720, 'Availability cannot exceed 12 hours'],
      default: 120,
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
    maxConcurrentTasks: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    activeTaskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

offerSchema.index({ zoneId: 1, status: 1, expiresAt: 1 });
offerSchema.index({ helperId: 1, zoneId: 1 });

export const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
