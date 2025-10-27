import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================
// AUTH API
// =====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/updatedetails', userData),
  updatePassword: (passwordData) => api.put('/auth/updatepassword', passwordData),
};

// =====================
// PRODUCTS API
// =====================
export const productsAPI = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, imageData) => api.put(`/products/${id}/image`, imageData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  buildImageUrl: (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    try {
      const baseUrl = API_URL ? new URL(API_URL) : new URL(window.location.origin);
      const origin = `${baseUrl.protocol}//${baseUrl.host}`;
      return new URL(path, origin).toString();
    } catch (err) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return normalizedPath;
    }
  }
};

// =====================
// REVIEWS API
// =====================
export const reviewsAPI = {
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),
  createReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData),
  updateReview: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  reportReview: (reviewId, reason) => api.post(`/reviews/${reviewId}/report`, { reason }),
};

// =====================
// ALERTS API
// =====================
export const alertsAPI = {
  getInventoryAlerts: () => api.get('/alerts/inventory'),
  getAlertSettings: () => api.get('/alerts/settings'),
  updateAlertSettings: (settings) => api.put('/alerts/settings', settings),
  dismissAlert: (alertId) => api.post(`/alerts/${alertId}/dismiss`),
};

// =====================
// CATEGORIES API
// =====================
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
  // Convenience helper: return an unwrapped array of categories regardless of envelope shape.
  // Some backends return an array directly, others return { data: [...] } or { value: [...] }.
  getCategoriesList: async () => {
    const res = await api.get('/categories');
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    return payload.data || payload.value || payload.categories || [];
  },
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
};

// =====================
// ORDERS API
// =====================
export const ordersAPI = {
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { cancellationReason: reason }),
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
};

// =====================
// PAYMENTS API
// =====================
export const paymentsAPI = {
  initiateTeleBirr: (paymentData) => api.post('/payments/telebirr', paymentData),
  initiateChapa: (paymentData) => api.post('/payments/chapa', paymentData),
  confirmCOD: (orderData) => api.post('/payments/cod', orderData),
  processBankTransfer: (transferData) => api.post('/payments/bank-transfer', transferData),
};

// =====================
// ADMIN API
// =====================
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAnalyticsOverview: (params = {}) => api.get('/admin/analytics/overview', { params }),
  getSalesAnalytics: (params = {}) => api.get('/admin/analytics/sales', { params }),
  getProductAnalytics: (params = {}) => api.get('/admin/analytics/products', { params }),
};

// =====================
// ANALYTICS API
// =====================
export const analyticsAPI = {
  getSalesData: (params = {}) => api.get('/analytics/sales', { params }),
  getProductPerformance: (params = {}) => api.get('/analytics/products', { params }),
  getCustomerMetrics: (params = {}) => api.get('/analytics/customers', { params }),
};

// =====================
// SELLER API
// =====================
export const sellerAPI = {
  getSellerStats: () => api.get('/seller/stats'),
  getSellerProducts: (params = {}) => api.get('/seller/products', { params }),
  createSellerProduct: (productData) => api.post('/seller/products', productData),
  updateSellerProduct: (id, productData) => api.put(`/seller/products/${id}`, productData),
  deleteSellerProduct: (id) => api.delete(`/seller/products/${id}`),
  getSellerOrders: (params = {}) => api.get('/seller/orders', { params }),
  getSellerOrder: (id) => api.get(`/seller/orders/${id}`),
  updateSellerOrder: (id, orderData) => api.put(`/seller/orders/${id}`, orderData),
  getSellerAnalytics: (params = {}) => api.get('/seller/analytics', { params }),
  getSellerProfile: () => api.get('/seller/profile'),
  updateSellerProfile: (profileData) => api.put('/seller/profile', profileData),
  getSellerPromotions: (params = {}) => api.get('/seller/promotions', { params }),
  createSellerPromotion: (promotionData) => api.post('/seller/promotions', promotionData),
  updateSellerPromotion: (id, promotionData) => api.put(`/seller/promotions/${id}`, promotionData),
  deleteSellerPromotion: (id) => api.delete(`/seller/promotions/${id}`),
};

// =====================
// BULK OPERATIONS API
// =====================
export const bulkAPI = {
  importProducts: (formData) => api.post('/bulk/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportProducts: (params = {}) => api.get('/bulk/export', { params, responseType: 'blob' }),
  bulkUpdateProducts: (updateData) => api.post('/bulk/update', updateData),
  bulkDeleteProducts: (productIds) => api.post('/bulk/delete', { productIds }),
  downloadTemplate: () => api.get('/bulk/template', { responseType: 'blob' })
};

// =====================
// PROMOTIONS API
// =====================
export const promotionsAPI = {
  getPromotions: (params = {}) => api.get('/promotions', { params }),
  getPromotion: (id) => api.get(`/promotions/${id}`),
  createPromotion: (promotionData) => api.post('/promotions', promotionData),
  updatePromotion: (id, promotionData) => api.put(`/promotions/${id}`, promotionData),
  deletePromotion: (id) => api.delete(`/promotions/${id}`),
  validatePromotion: (validationData) => api.post('/promotions/validate', validationData),
  getPromotionAnalytics: (id) => api.get(`/promotions/${id}/analytics`)
};

// =====================
// MARKETING API
// =====================
export const marketingAPI = {
  getCampaigns: (params = {}) => api.get('/marketing/campaigns', { params }),
  getCampaign: (id) => api.get(`/marketing/campaigns/${id}`),
  createCampaign: (campaignData) => api.post('/marketing/campaigns', campaignData),
  updateCampaign: (id, campaignData) => api.put(`/marketing/campaigns/${id}`, campaignData),
  deleteCampaign: (id) => api.delete(`/marketing/campaigns/${id}`),
  sendCampaign: (id) => api.post(`/marketing/campaigns/${id}/send`),
  getCampaignAnalytics: (id) => api.get(`/marketing/campaigns/${id}/analytics`),
  getMarketingStats: () => api.get('/marketing/stats'),
  getSubscribers: (params = {}) => api.get('/marketing/subscribers', { params }),
  addSubscriber: (email) => api.post('/marketing/subscribers', { email }),
  removeSubscriber: (email) => api.delete('/marketing/subscribers', { data: { email } })
};

// =====================
// LOYALTY API
// =====================
export const loyaltyAPI = {
  getLoyaltyProgram: () => api.get('/loyalty/program'),
  updateLoyaltyProgram: (programData) => api.put('/loyalty/program', programData),
  getLoyaltyMembers: (params = {}) => api.get('/loyalty/members', { params }),
  getLoyaltyMember: (userId) => api.get(`/loyalty/members/${userId}`),
  updateLoyaltyMember: (userId, memberData) => api.put(`/loyalty/members/${userId}`, memberData),
  earnPoints: (userId, pointsData) => api.post(`/loyalty/members/${userId}/earn`, pointsData),
  redeemPoints: (userId, redemptionData) => api.post(`/loyalty/members/${userId}/redeem`, redemptionData),
  transferPoints: (fromUserId, toUserId, points) => api.post('/loyalty/transfer', { fromUserId, toUserId, points }),
  getRewards: () => api.get('/loyalty/rewards'),
  claimReward: (rewardId) => api.post(`/loyalty/rewards/${rewardId}/claim`),
  getLoyaltyAnalytics: () => api.get('/loyalty/analytics')
};

// =====================
// ADVANCED ANALYTICS API
// =====================
export const advancedAnalyticsAPI = {
  getSalesFunnel: (params = {}) => api.get('/analytics/sales-funnel', { params }),
  getCustomerLifetimeValue: (params = {}) => api.get('/analytics/customer-lifetime-value', { params }),
  getPredictiveAnalytics: (params = {}) => api.get('/analytics/predictive', { params }),
  getGeographicAnalytics: (params = {}) => api.get('/analytics/geographic', { params }),
  getBehavioralAnalytics: (params = {}) => api.get('/analytics/behavioral', { params })
};

export default api;
