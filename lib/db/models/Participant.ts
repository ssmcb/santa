import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';

export type ParticipantDocument = Document & {
  group_id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  recipient_id: mongoose.Types.ObjectId | null;
  verification_code: string | null;
  code_expires_at: Date | null;
  code_sent_at: Date | null;
  assignment_email_status: EmailStatus;
  assignment_email_sent_at: Date | null;
};

const ParticipantSchema = new Schema<ParticipantDocument>(
  {
    group_id: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipient_id: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      default: null,
    },
    verification_code: {
      type: String,
      default: null,
    },
    code_expires_at: {
      type: Date,
      default: null,
    },
    code_sent_at: {
      type: Date,
      default: null,
    },
    assignment_email_status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'bounced', 'failed'],
      default: 'pending',
    },
    assignment_email_sent_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ParticipantSchema.index({ group_id: 1, email: 1 }, { unique: true });
ParticipantSchema.index({ email: 1 });
ParticipantSchema.index({ verification_code: 1 });

export const Participant: Model<ParticipantDocument> =
  mongoose.models.Participant || mongoose.model<ParticipantDocument>('Participant', ParticipantSchema);
