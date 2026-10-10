import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
      minlength: [2, 'Zone name must be at least 2 characters long'],
      maxlength: [100, 'Zone name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Zone description is required'],
      trim: true,
      maxlength: [500, 'Zone description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      required: [true, 'Zone type is required'],
      enum: {
        values: ['campus', 'hackathon', 'event', 'transit', 'community'],
        message: '{VALUE} is not a valid zone type',
      },
      index: true,
    },
    centerLatitude: {
      type: Number,
      required: [true, 'Center latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    centerLongitude: {
      type: Number,
      required: [true, 'Center longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    radiusMeters: {
      type: Number,
      required: [true, 'Radius in meters is required'],
      min: [50, 'Radius must be at least 50 meters'],
      max: [50000, 'Radius cannot exceed 50,000 meters'],
    },
    startDate: {
      type: Date,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 3600000), // Default 48h event window
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinCode: {
      type: String,
      trim: true,
      default: 'DROP2026',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    announcements: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        authorName: { type: String, default: 'Organizer' },
        createdAt: { type: Date, default: () => new Date() },
      },
    ],
    venueName: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters'],
      default: '',
    },
    venueAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Venue address cannot exceed 500 characters'],
      default: '',
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    boundaryType: {
      type: String,
      enum: {
        values: ['radius', 'unspecified', 'virtual'],
        message: '{VALUE} is not a valid boundary type',
      },
      default: 'radius',
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
