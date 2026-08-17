const mongoose = require('mongoose');

const ownershipRequestSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    in_person_request: {
      preferred_date: { type: Date, default: null },
      preferred_time: { type: String, default: '' },
      note: { type: String, default: '' },
      status: {
        type: String,
        enum: ['NONE', 'REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'],
        default: 'NONE',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OwnershipRequest', ownershipRequestSchema);
