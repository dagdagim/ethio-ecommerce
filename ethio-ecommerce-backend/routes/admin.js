const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, updateUserRole, updateUser, getAnalyticsOverview } = require('../controllers/admin');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// List users
router.get('/users', getUsers);

// Update user role (promote/demote)
router.put('/users/:id/role', updateUserRole);

// Update user fields (isVerified, role, name, phone)
router.put('/users/:id', updateUser);

// Analytics overview
router.get('/analytics/overview', getAnalyticsOverview);

module.exports = router;
