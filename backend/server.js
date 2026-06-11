const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Donation = require('./models/Donation');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqfood';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://Tr2418.github.io',
    'https://tr2418.github.io',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'ResQFood');
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next();
});

const seedDonations = async () => {
  try {
    const count = await Donation.countDocuments();
    if (count === 0) {
      const seeds = [
        {
          donorType: 'Wedding Hall',
          foodItems: 'Mixed veg biryani, dal tadka, gulab jamun, salad',
          quantity: 120,
          location: 'Grand Palace Banquet, Andheri West, Mumbai',
          status: 'Pending',
        },
        {
          donorType: 'Hotel',
          foodItems: 'Butter chicken, naan bread, rice pulao, raita',
          quantity: 45,
          location: 'Taj Mahal Palace, Colaba, Mumbai',
          status: 'Pending',
        },
        {
          donorType: 'Bakery',
          foodItems: 'Assorted pastries, bread loaves, cupcakes, cookies',
          quantity: 80,
          location: 'Sweet cravings Bakery, Koramangala, Bangalore',
          status: 'Claimed',
        },
      ];
      await Donation.insertMany(seeds);
      console.log(`Seeded ${seeds.length} initial donations`);
    } else {
      console.log(`Database already has ${count} donations, skipping seed`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

app.get('/api/donations', async (req, res, next) => {
  try {
    const donations = await Donation.find({ status: { $ne: 'Completed' } })
      .sort({ createdAt: -1 })
      .lean();
    const total = await Donation.countDocuments({ status: 'Completed' });
    res.json({ success: true, data: donations, totalCompletedMeals: total });
  } catch (err) {
    next(err);
  }
});

app.post('/api/donations', async (req, res, next) => {
  try {
    const { donorType, foodItems, quantity, location } = req.body;
    if (!donorType || !foodItems || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: donorType, foodItems, quantity, location',
      });
    }
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }
    const validTypes = ['Wedding Hall', 'Hostel', 'Hotel', 'Bakery'];
    if (!validTypes.includes(donorType)) {
      return res.status(400).json({
        success: false,
        message: `donorType must be one of: ${validTypes.join(', ')}`,
      });
    }
    const donation = await Donation.create({ donorType, foodItems, quantity, location });
    res.status(201).json({ success: true, data: donation });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(err);
  }
});

app.patch('/api/donations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID format' });
    }

    const validStatuses = ['Pending', 'Claimed', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const donation = await Donation.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const startServer = async () => {
  let uri = MONGODB_URI;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB at', uri);
  } catch (err) {
    console.warn('MongoDB not available, starting in-memory MongoDB...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB at', uri);
  }
  await seedDonations();
  app.listen(PORT, () => {
    console.log(`ResQFood API running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;
