const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const PAID_PAYMENT_STATUSES = ['completed'];
const SUCCESS_ORDER_STATUSES = ['delivered'];

const paymentMethodLabels = {
  telebirr: 'TeleBirr',
  cbe: 'CBE',
  cod: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer',
  chapa: 'Chapa'
};

const rangeToDays = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  '1year': 365
};

const getPercentChange = (current, previous) => {
  if (!previous || previous === 0) {
    if (!current || current === 0) {
      return 0;
    }
    return 100;
  }

  return ((current - previous) / previous) * 100;
};

const isRevenueEligibleOrder = (order) => {
  if (!order) return false;
  if (PAID_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return true;
  }

  return SUCCESS_ORDER_STATUSES.includes(order.status);
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const allowedRoles = ['user', 'seller', 'admin'];
  const { role } = req.body;

  if (!role || !allowedRoles.includes(role)) {
    return next(new ErrorResponse(`Invalid role. Allowed roles: ${allowedRoles.join(', ')}`, 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`No user found with id of ${req.params.id}`, 404));
  }

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, data: { id: user._id, email: user.email, role: user.role } });
});

// @desc    Update user fields (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { role, isVerified, name, phone } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`No user found with id of ${req.params.id}`, 404));
  }

  if (role) {
    const allowedRoles = ['user', 'seller', 'admin'];
    if (!allowedRoles.includes(role)) {
      return next(new ErrorResponse(`Invalid role. Allowed roles: ${allowedRoles.join(', ')}`, 400));
    }
    user.role = role;
  }

  if (typeof isVerified === 'boolean') {
    user.isVerified = isVerified;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();

  res.status(200).json({ success: true, data: { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified } });
});

// @desc    Get analytics overview for admin dashboard
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
exports.getAnalyticsOverview = asyncHandler(async (req, res, next) => {
  const { range = '30days' } = req.query;
  const days = rangeToDays[range] || rangeToDays['30days'];

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const previousRangeEnd = new Date(startDate.getTime() - 1);
  const previousRangeStart = new Date(previousRangeEnd);
  previousRangeStart.setHours(0, 0, 0, 0);
  previousRangeStart.setDate(previousRangeStart.getDate() - (days - 1));

  const currentMatchStage = { createdAt: { $gte: startDate, $lte: endDate } };
  const previousMatchStage = { createdAt: { $gte: previousRangeStart, $lte: previousRangeEnd } };

  const [
    currentOrders,
    previousOrders,
    salesDataAgg,
    paymentMethodAgg,
    topProductsAgg,
    previousTopProductsAgg,
    newCustomersAgg,
    lifetimeValueAgg
  ] = await Promise.all([
    Order.find(currentMatchStage).populate('customer', 'name email createdAt'),
    Order.find(previousMatchStage),
    Order.aggregate([
      { $match: currentMatchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: currentMatchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    Order.aggregate([
      { $match: currentMatchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: '$items.subtotal' },
          quantity: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          revenue: 1,
          quantity: 1,
          ordersCount: { $size: '$orders' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]),
    Order.aggregate([
      { $match: previousMatchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: '$items.subtotal' }
        }
      }
    ]),
    Order.aggregate([
      { $match: currentMatchStage },
      {
        $group: {
          _id: '$customer',
          firstOrderDate: { $min: '$createdAt' }
        }
      },
      { $match: { firstOrderDate: { $gte: startDate } } },
      { $count: 'count' }
    ]),
    Order.aggregate([
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  const totalRevenue = currentOrders.reduce((sum, order) => {
    return sum + (isRevenueEligibleOrder(order) ? order.totalAmount : 0);
  }, 0);

  const previousRevenue = previousOrders.reduce((sum, order) => {
    return sum + (isRevenueEligibleOrder(order) ? order.totalAmount : 0);
  }, 0);

  const totalOrders = currentOrders.length;
  const previousTotalOrders = previousOrders.length;

  const completedOrdersCount = currentOrders.filter(isRevenueEligibleOrder).length;
  const previousCompletedOrdersCount = previousOrders.filter(isRevenueEligibleOrder).length;

  const averageOrderValue = completedOrdersCount ? totalRevenue / completedOrdersCount : 0;
  const previousAverageOrderValue = previousCompletedOrdersCount ? previousRevenue / previousCompletedOrdersCount : 0;

  const uniqueCustomers = new Set(
    currentOrders
      .map((order) => (order.customer ? order.customer._id?.toString?.() || order.customer.toString() : null))
      .filter(Boolean)
  );

  const previousUniqueCustomers = new Set(
    previousOrders
      .map((order) => (order.customer ? order.customer.toString() : null))
      .filter(Boolean)
  );

  const totalCustomers = uniqueCustomers.size;
  const newCustomers = newCustomersAgg[0]?.count || 0;
  const returningCustomers = Math.max(totalCustomers - newCustomers, 0);

  const conversionRate = totalCustomers ? (completedOrdersCount / totalCustomers) * 100 : 0;
  const previousConversionRate = previousUniqueCustomers.size
    ? (previousCompletedOrdersCount / previousUniqueCustomers.size) * 100
    : 0;

  const pendingOrders = currentOrders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
  const previousPendingOrders = previousOrders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;

  const lifetimeTotals = lifetimeValueAgg.reduce(
    (acc, customer) => {
      if (!customer || !customer.totalSpent) {
        return acc;
      }
      return {
        totalSpent: acc.totalSpent + customer.totalSpent,
        customers: acc.customers + 1
      };
    },
    { totalSpent: 0, customers: 0 }
  );

  const customerLifetimeValue = lifetimeTotals.customers
    ? lifetimeTotals.totalSpent / lifetimeTotals.customers
    : 0;

  const customerAcquisitionCost = newCustomers
    ? (totalRevenue / newCustomers) * 0.1
    : 0;

  const conversionRateChange = getPercentChange(conversionRate, previousConversionRate);
  const revenueChange = getPercentChange(totalRevenue, previousRevenue);
  const totalOrdersChange = getPercentChange(totalOrders, previousTotalOrders);
  const averageOrderValueChange = getPercentChange(averageOrderValue, previousAverageOrderValue);
  const pendingOrdersChange = getPercentChange(pendingOrders, previousPendingOrders);

  const salesData = salesDataAgg.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders
  }));

  const paymentMethodsTotal = paymentMethodAgg.reduce((sum, method) => sum + method.count, 0);
  const paymentMethods = paymentMethodAgg.map((method) => ({
    method: paymentMethodLabels[method._id] || method._id,
    count: method.count,
    percentage: paymentMethodsTotal
      ? Number(((method.count / paymentMethodsTotal) * 100).toFixed(1))
      : 0
  }));

  const previousTopProductMap = previousTopProductsAgg.reduce((map, product) => {
    map.set(product._id?.toString?.(), product.revenue || 0);
    return map;
  }, new Map());

  const productIds = topProductsAgg
    .map((product) => (product._id ? product._id.toString() : null))
    .filter(Boolean);

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select('name')
    : [];

  const productMap = products.reduce((map, product) => {
    map.set(product._id.toString(), product);
    return map;
  }, new Map());

  const topProducts = topProductsAgg.map((product) => {
    const productId = product._id ? product._id.toString() : null;
    const productDoc = productId ? productMap.get(productId) : null;
    const previousRevenueForProduct = productId ? previousTopProductMap.get(productId) || 0 : 0;

    return {
      id: productId,
      name: productDoc?.name?.en || productDoc?.name || 'Unknown Product',
      revenue: product.revenue || 0,
      orders: product.ordersCount || 0,
      quantity: product.quantity || 0,
      growth: getPercentChange(product.revenue || 0, previousRevenueForProduct)
    };
  });

  const returnsCount = currentOrders.filter(
    (order) => order.status === 'returned' || order.returnStatus === 'completed'
  ).length;

  const cancelledCount = currentOrders.filter(
    (order) => order.status === 'cancelled' || order.paymentStatus === 'cancelled'
  ).length;

  const deliveredOrders = currentOrders.filter((order) => order.deliveredAt);
  const averageDeliveryTime = deliveredOrders.length
    ? deliveredOrders.reduce((sum, order) => sum + ((order.deliveredAt - order.createdAt) / (1000 * 60 * 60 * 24)), 0) /
      deliveredOrders.length
    : null;

  const returnRate = totalOrders ? (returnsCount / totalOrders) * 100 : 0;
  const customerSatisfaction = totalOrders
    ? ((totalOrders - cancelledCount - returnsCount) / totalOrders) * 100
    : 0;

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        pendingOrders,
        totalCustomers
      },
      periodComparison: {
        totalRevenue: revenueChange,
        totalOrders: totalOrdersChange,
        averageOrderValue: averageOrderValueChange,
        conversionRate: conversionRateChange,
        pendingOrders: pendingOrdersChange
      },
      salesData,
      topProducts,
      customerMetrics: {
        newCustomers,
        returningCustomers,
        customerAcquisitionCost,
        customerLifetimeValue
      },
      paymentMethods,
      additionalMetrics: {
        customerSatisfaction,
        averageDeliveryTime,
        returnRate
      }
    }
  });
});
