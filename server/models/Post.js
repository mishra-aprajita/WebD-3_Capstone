import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    /**
     * mediaType: 'image' | 'video'
     * Derived from the uploaded file mimetype or the URL extension.
     * Defaults to 'image' for backward-compat with existing posts.
     */
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    /**
     * isReel: true when user toggled "Post as Reel" during creation,
     * or when mediaType === 'video'.
     */
    isReel: {
      type: Boolean,
      default: false,
    },
    caption: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reposts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.likesCount = Array.isArray(ret.likes) ? ret.likes.length : 0;
        ret.repostCount = Array.isArray(ret.reposts) ? ret.reposts.length : 0;
        // Ensure mediaType always present in serialised output
        if (!ret.mediaType) ret.mediaType = 'image';
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for likesCount
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

export const Post = mongoose.model('Post', postSchema);
