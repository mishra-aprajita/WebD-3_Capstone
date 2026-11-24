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
  },
  { timestamps: true }
);

export const Reel = mongoose.model('Reel', reelSchema);
