import mongoose from 'mongoose';

const archivedStorySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Archived story author is required'],
      index: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    caption: {
      type: String,
      default: '',
    },
    isCloseFriendsOnly: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Fallback convenience for imageUrl if frontend uses imageUrl
        ret.imageUrl = ret.mediaUrl;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for imageUrl
archivedStorySchema.virtual('imageUrl').get(function () {
  return this.mediaUrl;
});

export const ArchivedStory = mongoose.model('ArchivedStory', archivedStorySchema);
