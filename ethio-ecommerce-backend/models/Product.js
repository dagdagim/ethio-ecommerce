const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        en: { 
            type: String, 
            required: [true, 'Please add English product name'],
            trim: true,
            maxlength: [100, 'Product name cannot be more than 100 characters']
        },
        am: { 
            type: String, 
            required: [true, 'Please add Amharic product name'],
            trim: true,
            maxlength: [100, 'Product name cannot be more than 100 characters']
        }
    },
    description: {
        en: { 
            type: String, 
            required: [true, 'Please add English description'],
            maxlength: [1000, 'Description cannot be more than 1000 characters']
        },
        am: { 
            type: String, 
            required: [true, 'Please add Amharic description'],
            maxlength: [1000, 'Description cannot be more than 1000 characters']
        }
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
        min: [0, 'Price cannot be negative']
    },
    basePrice: {
        type: Number,
        min: [0, 'Base price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    manualOriginalPrice: {
        type: Number,
        min: [0, 'Manual original price cannot be negative']
    },
    promotionDiscountPercent: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        default: 'ETB',
        enum: ['ETB', 'USD']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: String
    },
    images: [{
        url: String,
        altText: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    brand: String,
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Ethiopian-specific fields
    location: {
        region: {
            type: String,
            enum: ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'SNNPR', 'Tigray'],
            required: true
        },
        city: {
            type: String,
            required: true
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['g', 'kg'],
            default: 'g'
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            default: 'cm'
        }
    },
    // Product status
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
        default: 'active'
    },
    // SEO fields
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    metaTitle: String,
    metaDescription: String,
    // Ratings and reviews
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    // Tags for better search
    tags: [String],
    activePromotions: [
        {
            promotionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SellerPromotion'
            },
            title: String,
            type: {
                type: String,
                enum: ['percentage', 'amount', 'bundle'],
                default: 'percentage'
            },
            discountValue: Number,
            startDate: Date,
            endDate: Date,
            status: {
                type: String,
                enum: ['Draft', 'Scheduled', 'Running', 'Completed', 'Archived'],
                default: 'Scheduled'
            }
        }
    ],
    // Shipping information
    shipping: {
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        estimatedDelivery: {
            min: Number, // days
            max: Number  // days
        }
    }
}, {
    timestamps: true
});

// Generate SKU before saving
productSchema.pre('save', async function(next) {
    if (!this.sku) {
        const Category = require('./Category');
        const category = await Category.findById(this.category);
        const prefix = category ? category.code : 'PROD';
        this.sku = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Generate slug from English name
    if (!this.slug && this.name.en) {
        this.slug = this.name.en
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    
    if (this.isNew && (this.basePrice === undefined || this.basePrice === null)) {
        this.basePrice = this.price;
    }

    if (this.isNew && this.manualOriginalPrice === undefined && this.originalPrice !== undefined) {
        this.manualOriginalPrice = this.originalPrice;
    }

    next();
});

// Index for search functionality
productSchema.index({
    'name.en': 'text',
    'name.am': 'text',
    'description.en': 'text', 
    'description.am': 'text',
    tags: 'text'
});

productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ 'location.region': 1, 'location.city': 1 });
productSchema.index({ seller: 1, 'activePromotions.promotionId': 1 });

module.exports = mongoose.model('Product', productSchema);