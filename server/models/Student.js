const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    registration_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    class: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    parent_name: {
      type: String,
      trim: true,
    },
    parent_email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
