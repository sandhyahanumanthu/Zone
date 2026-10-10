import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: true }
);

const collaborationSchema = new mongoose.Schema(
  {
    needId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Need',
      required: [true, 'Need ID is required'],
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Helper ID is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Collaboration deadline is required'],
      index: true,
    },
    notes: [noteSchema],
    completedAt: {
      type: Date,
      default: null,
    },
    completionConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    summaryOutcome: {
      type: String,
      trim: true,
      maxlength: [500, 'Summary outcome cannot exceed 500 characters'],
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

collaborationSchema.index({ requesterId: 1, status: 1 });
collaborationSchema.index({ helperId: 1, status: 1 });
collaborationSchema.index({ zoneId: 1, status: 1 });

export const Collaboration = mongoose.model('Collaboration', collaborationSchema);
export default Collaboration;
