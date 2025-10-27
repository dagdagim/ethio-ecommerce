const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Route files
const auth = require('./routes/auth');
const products = require('./routes/products');
const orders = require('./routes/orders');
const payments = require('./routes/payments');
const categories = require('./routes/categories');
const admin = require('./routes/admin');
const seller = require('./routes/seller');

// Middleware
const errorHandler = require('./middleware/error');
const { setLocation } = require('./middleware/auth');

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize data
app.use(mongoSanitize());

// Set security headers; allow serving assets to other origins (e.g. CRA dev server)
app.use(helmet({
    crossOriginResourcePolicy: {
        policy: 'cross-origin'
    },
    crossOriginEmbedderPolicy: false
}));

// Prevent XSS attacks
app.use(xss());

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// File uploads
app.use(fileUpload());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Ethiopian location middleware
app.use(setLocation);

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/payments', payments);
app.use('/api/categories', categories);
app.use('/api/admin', admin);
app.use('/api/seller', seller);

// Home route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Ethio E-Commerce API is running...',
        data: {
            version: '1.0.0',
            environment: process.env.NODE_ENV,
            country: 'Ethiopia',
            currency: 'ETB'
        }
    });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('MongoDB Connected successfully');
        
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`Ethio E-Commerce Backend API is ready!`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
});

startServer();