import mongoose from 'mongoose';

/**
 * Admin Credentials Model
 * Note: Password is saved in simple plain text as requested by the user.
 */
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'admin',
    },
    password: {
      type: String,
      required: true,
      default: 'admin123',
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema);
