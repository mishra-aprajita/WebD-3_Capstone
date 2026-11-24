import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Story author is required'],
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    caption: {
      type: String,
      default: '',
    },
    isCloseFriendsOnly: {
      type: Boolean,
      default: false,
    },
    // MongoDB 24-hour TTL index (86400 seconds)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.expiresAt = new Date(new Date(ret.createdAt).getTime() + 86400 * 1000).toISOString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

export const Story = mongoose.model('Story', storySchema);
