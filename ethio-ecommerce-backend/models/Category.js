const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        en: { 
            type: String, 
            required: [true, 'Please add English category name'],
            unique: true,
            trim: true
        },
        am: { 
            type: String, 
            required: [true, 'Please add Amharic category name'],
            unique: true,
            trim: true
        }
    },
    description: {
        en: String,
        am: String
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        maxlength: 10
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: String,
    icon: String,
    isActive: {
        type: Boolean,
        default: true
    },
    // Ethiopian market specific ordering
    displayOrder: {
        type: Number,
        default: 0
    },
    // SEO fields
    slug: {
        type: String,
        unique: true
    },
    metaTitle: String,
    metaDescription: String
}, {
    timestamps: true
});

// Generate slug before saving
productSchema.pre('save', function(next) {
    if (!this.slug && this.name.en) {
        this.slug = this.name.en
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

module.exports = mongoose.model('Category', productSchema);