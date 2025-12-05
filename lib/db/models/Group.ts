import mongoose, { Schema, Document, Model } from 'mongoose';

type InvitationSentDB = {
  email: string;
  sentAt: Date;
};

export type GroupDocument = Document & {
  name: string;
  budget: string;
  date: Date;
  place: string;
  owner_email: string;
  participants: mongoose.Types.ObjectId[];
  invite_id: string;
  is_drawn: boolean;
  invitations_sent: InvitationSentDB[];
};

const GroupSchema = new Schema<GroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    owner_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Participant',
      },
    ],
    invite_id: {
      type: String,
      required: true,
      unique: true,
    },
    is_drawn: {
      type: Boolean,
      default: false,
    },
    invitations_sent: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        sentAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({ owner_email: 1 });

export const Group: Model<GroupDocument> =
  mongoose.models.Group || mongoose.model<GroupDocument>('Group', GroupSchema);
