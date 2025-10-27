const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
    {
        name: {
            en: 'Electronics',
            am: 'ኤሌክትሮኒክስ'
        },
        code: 'ELEC',
        description: {
            en: 'Electronic devices and accessories',
            am: 'ኤሌክትሮኒክ መሳሪያዎች እና መያዣዎች'
        }
    },
    {
        name: {
            en: 'Clothing',
            am: 'ልብስ'
        },
        code: 'CLTH',
        description: {
            en: 'Men, women and children clothing',
            am: 'ወንድ፣ ሴት እና ልጆች ልብስ'
        }
    },
    {
        name: {
            en: 'Food & Groceries',
            am: 'ምግብ እና ዕቃዎች'
        },
        code: 'FOOD',
        description: {
            en: 'Food items and groceries',
            am: 'የምግብ እቃዎች እና ዕቃዎች'
        }
    },
    {
        name: {
            en: 'Home & Garden',
            am: 'ቤት እና አትክልት'
        },
        code: 'HOME',
        description: {
            en: 'Home appliances and garden tools',
            am: 'የቤት እቃዎች እና የአትክልት መሳሪያዎች'
        }
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        await Category.deleteMany();
        await Category.insertMany(categories);
        
        console.log('Categories seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();