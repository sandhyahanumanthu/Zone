import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [3, 'Content must be at least 3 characters long'],
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['All', 'Events', 'Lost & Found', 'Study Groups', 'Team Up', 'Questions'],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry timestamp is required'],
      index: true,
      validate: {
        validator(val) {
          // Must expire in the future upon creation
          return !this.isNew || val > new Date();
        },
        message: 'Expiry date must be in the future',
      },
    },
    moderationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'flagged', 'removed'],
        message: '{VALUE} is not a valid moderation status',
      },
      default: 'approved',
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

// Compound index to optimize public feed queries filtering by zone, status, and expiry
postSchema.index({ zoneId: 1, expiresAt: 1, moderationStatus: 1 });
postSchema.index({ category: 1, expiresAt: 1 });

export const Post = mongoose.model('Post', postSchema);
export default Post;
