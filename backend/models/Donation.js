const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorType: {
      type: String,
      required: [true, 'Donor type is required'],
      enum: ['Wedding Hall', 'Hostel', 'Hotel', 'Bakery'],
    },
    foodItems: {
      type: String,
      required: [true, 'Food items description is required'],
      trim: true,
      minlength: [3, 'Food items must be at least 3 characters'],
      maxlength: [200, 'Food items cannot exceed 200 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10000, 'Quantity cannot exceed 10000'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [3, 'Location must be at least 3 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Claimed', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Donation', donationSchema);
