import mongoose from 'mongoose';

const highlightItemSchema = new mongoose.Schema(
  {
    mediaUrl: {
      type: String,
      required: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const highlightSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Highlight owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Highlight title is required'],
      trim: true,
      maxlength: [30, 'Title cannot exceed 30 characters'],
    },
    coverUrl: {
      type: String,
      default: '',
    },
    items: [highlightItemSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Default coverUrl to first item's mediaUrl if empty
        if (!ret.coverUrl && ret.items && ret.items.length > 0) {
          ret.coverUrl = ret.items[0].mediaUrl;
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

export const Highlight = mongoose.model('Highlight', highlightSchema);
