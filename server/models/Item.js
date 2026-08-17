const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'ID / Cards',
  'Accessories', 'Bags', 'Keys', 'Stationery', 'Other',
];

const LOCATIONS = [
  'Library', 'Cafeteria', 'Classroom', 'Hostel',
  'Parking', 'Sports Area', 'Administrative Block', 'Other',
];

const STATUSES = ['PENDING', 'PUBLISHED', 'UNPUBLISHED', 'CLAIMED', 'RETURNED', 'EXPIRED'];

const itemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    brand: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    location_found: { type: String, enum: LOCATIONS, required: true },
    date_found: { type: Date, required: true },
    time_found: { type: String, default: '' },
    description: { type: String, trim: true, default: '' },
    image_url: { type: String, default: '' },
    image_filename: { type: String, default: '' },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    registration_number: { type: String, required: true },
    student_name: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    uploaded_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Text index for search
itemSchema.index({
  brand: 'text',
  color: 'text',
  description: 'text',
  student_name: 'text',
});

module.exports = mongoose.model('Item', itemSchema);
