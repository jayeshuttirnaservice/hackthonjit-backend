import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      default: 'JIT College of Engineering',
    },
    technologyDomain: {
      type: String,
      required: [true, 'Technology / Domain is required'],
      trim: true,
      default: 'Autonomous AI & Machine Learning',
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    members: [memberSchema],
    transactionId: {
      type: String,
      required: [true, 'Transaction ID / UTR is required'],
      trim: true,
    },
    paymentScreenshot: {
      type: String, // Base64 data URL or image path
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    confirmationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    venue: {
      type: String,
      default: 'JIT Campus Labs & Auditorium',
    },
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
