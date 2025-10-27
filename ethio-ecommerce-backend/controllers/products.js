const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { applyPromotionsToProducts } = require('../utils/promotionSync');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    let query = Product.find(JSON.parse(queryStr)).populate('category', 'name code');
    
    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }
    
    // Search functionality
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query = query.or([
            { 'name.en': searchRegex },
            { 'name.am': searchRegex },
            { 'description.en': searchRegex },
            { 'description.am': searchRegex },
            { tags: searchRegex }
        ]);
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const products = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }
    
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }
    
    res.status(200).json({
        success: true,
        count: products.length,
        pagination,
        data: products
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name code')
        .populate('seller', 'name phone');

    if (!product) {
        return next(
            new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: product
    });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller/Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.seller = req.user.id;

    if (req.body.price !== undefined) {
        req.body.basePrice = req.body.price;
    }

    if (req.body.originalPrice !== undefined) {
        req.body.manualOriginalPrice = req.body.originalPrice;
    }
    delete req.body.activePromotions;
    
    // Handle multilingual names and descriptions
    if (typeof req.body.name === 'string') {
        req.body.name = {
            en: req.body.name,
            am: req.body.name_am || req.body.name
        };
    }
    
    if (typeof req.body.description === 'string') {
        req.body.description = {
            en: req.body.description,
            am: req.body.description_am || req.body.description
        };
    }
    
    const product = await Product.create(req.body);

    await applyPromotionsToProducts(req.user.id);
    const refreshed = await Product.findById(product._id).populate('category', 'name code');

    res.status(201).json({
        success: true,
        data: refreshed
    });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(
            new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, 401)
        );
    }

    const sellerId = product.seller.toString();

    // Handle multilingual updates
    if (req.body.name && typeof req.body.name === 'string') {
        req.body.name = {
            en: req.body.name,
            am: req.body.name_am || product.name.am
        };
    }
    
    if (req.body.description && typeof req.body.description === 'string') {
        req.body.description = {
            en: req.body.description,
            am: req.body.description_am || product.description.am
        };
    }

    if (req.body.price !== undefined) {
        req.body.basePrice = req.body.price;
    }

    if (req.body.originalPrice !== undefined) {
        req.body.manualOriginalPrice = req.body.originalPrice;
    }

    delete req.body.activePromotions;

    await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    await applyPromotionsToProducts(sellerId);
    product = await Product.findById(req.params.id)
        .populate('category', 'name code');

    res.status(200).json({
        success: true,
        data: product
    });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(
            new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, 401)
        );
    }

    const sellerId = product.seller.toString();

    await product.deleteOne();
    await applyPromotionsToProducts(sellerId);

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Upload image for product
// @route   PUT /api/products/:id/image
// @access  Private (Seller/Admin)
exports.uploadProductImage = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(
            new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, 401)
        );
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    // Make sure the file is an image
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(
            new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_SIZE}`, 400)
        );
    }

    // Create custom filename
    file.name = `photo_${product._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Product.findByIdAndUpdate(req.params.id, {
            $push: {
                images: {
                    url: `/uploads/${file.name}`,
                    altText: product.name.en
                }
            }
        });

        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});