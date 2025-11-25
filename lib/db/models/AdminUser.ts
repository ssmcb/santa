import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdminUserDocument = Document & {
  email: string;
  name: string;
  is_registered: boolean;
};

const AdminUserSchema = new Schema<AdminUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    is_registered: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminUser: Model<AdminUserDocument> =
  mongoose.models.AdminUser || mongoose.model<AdminUserDocument>('AdminUser', AdminUserSchema);
