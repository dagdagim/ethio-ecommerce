/*
  Run this script to create an initial admin user.
  Usage (from project root):
    node scripts/createAdmin.js
  The script reads these env vars (optional):
    ADMIN_NAME (default: Admin User)
    ADMIN_EMAIL (default: admin@example.com)
    ADMIN_PASSWORD (default: Password123!)
    MONGODB_URI - must be set in .env or environment
*/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const name = process.env.ADMIN_NAME || 'Admin User';
const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.env.ADMIN_PASSWORD || 'Password123!';
// Minimal valid phone and address to satisfy User model validators
const phone = process.env.ADMIN_PHONE || '0911223344';
const address = {
  street: process.env.ADMIN_STREET || 'Admin St',
  city: process.env.ADMIN_CITY || 'Addis Ababa',
  region: process.env.ADMIN_REGION || 'Addis Ababa',
  postalCode: process.env.ADMIN_POSTAL || '1000'
};

const start = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Please set MONGODB_URI in your environment or .env before running this script');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    let user = await User.findOne({ email });
    if (user) {
      if (user.role === 'admin') {
        console.log(`User ${email} already exists and is an admin`);
      } else {
        user.role = 'admin';
        await user.save();
        console.log(`Updated existing user ${email} to role=admin`);
      }
      process.exit(0);
    }

  user = new User({ name, email, phone, password, role: 'admin', isVerified: true, address });
    await user.save();

    console.log(`Created admin user: ${email} (password: ${password})`);
    console.log('You can now log in and use admin routes.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err.message || err);
    process.exit(1);
  }
};

start();
