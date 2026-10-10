import mongoose from 'mongoose';

const eventMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['participant', 'organizer'],
      default: 'participant',
    },
    status: {
      type: String,
      enum: ['active', 'left', 'banned'],
      default: 'active',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: () => new Date(),
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

// One active membership per user per event zone
eventMembershipSchema.index({ userId: 1, zoneId: 1 }, { unique: true });

export const EventMembership = mongoose.model('EventMembership', eventMembershipSchema);
export default EventMembership;
