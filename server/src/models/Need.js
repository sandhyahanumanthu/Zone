import mongoose from 'mongoose';

export const NEED_CATEGORIES = [
  'Technical Help',
  'Team Formation',
  'UI/UX Design',
  'Coding & Debugging',
  'Hardware & IoT',
  'Event Questions',
  'Lost & Found',
];

export const NEED_STATUSES = [
  'OPEN',
  'MATCHED',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
  'EXPIRED',
];

const needSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone/Event ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Need title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Need description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: NEED_CATEGORIES,
        message: '{VALUE} is not an authorized need category',
      },
      index: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
      index: true,
    },
    estimatedDurationMinutes: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: [10, 'Duration must be at least 10 minutes'],
      max: [720, 'Duration cannot exceed 12 hours'],
      default: 60,
    },
    urgency: {
      type: String,
      enum: ['low', 'normal', 'urgent'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public_event', 'members_only'],
      default: 'members_only',
    },
    status: {
      type: String,
      enum: {
        values: NEED_STATUSES,
        message: '{VALUE} is not a valid need status',
      },
      default: 'OPEN',
      index: true,
    },
    acceptedHelperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    activeCollaborationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collaboration',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Resolution notes cannot exceed 500 characters'],
      default: '',
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

// High-performance compound indexes for matching and zone-scoped filtering
needSchema.index({ zoneId: 1, status: 1, expiresAt: 1 });
needSchema.index({ requesterId: 1, status: 1 });
needSchema.index({ category: 1, status: 1 });

export const Need = mongoose.model('Need', needSchema);
export default Need;
