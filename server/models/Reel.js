import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    audioTitle: {
      type: String,
      default: '',
      trim: true,
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
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.likesCount = Array.isArray(ret.likes) ? ret.likes.length : 0;
        ret.repostCount = Array.isArray(ret.reposts) ? ret.reposts.length : 0;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Reel = mongoose.model('Reel', reelSchema);
