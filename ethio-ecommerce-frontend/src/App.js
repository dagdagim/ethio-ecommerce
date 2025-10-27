import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AppProvider } from './contexts/AppContext';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderPaymentPage from './pages/OrderPaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCategoryNewPage from './pages/admin/AdminCategoryNewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage';
import AddProductPage from './pages/seller/AddProductPage';
import SellerInventoryPage from './pages/seller/SellerInventoryPage';
import SellerPromotionPage from './pages/seller/SellerPromotionPage';
import SellerReportsPage from './pages/seller/SellerReportsPage';
import SellerStoreProfilePage from './pages/seller/SellerStoreProfilePage';

function App() {
  return (
    <Router>
      <AppProvider>
        <AuthProvider>
          <CartProvider>
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <Routes>
                  {/* =====================
                      PUBLIC ROUTES
                  ===================== */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* =====================
                      PROTECTED ROUTES
                  ===================== */}
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <PrivateRoute>
                        <OrdersPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/order/:id"
                    element={
                      <PrivateRoute>
                        <OrderDetailPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/order/:id/payment"
                    element={
                      <PrivateRoute>
                        <OrderPaymentPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/order/:id/success"
                    element={
                      <PrivateRoute>
                        <OrderSuccessPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <PrivateRoute>
                        <CheckoutPage />
                      </PrivateRoute>
                    }
                  />

                  {/* =====================
                      ADMIN ROUTES
                  ===================== */}
                  <Route
                    path="/admin/*"
                    element={
                      <PrivateRoute>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  >
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="products/new" element={<AdminProductsPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="categories/new" element={<AdminCategoryNewPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                  </Route>

                  {/* =====================
                      SELLER ROUTES
                  ===================== */}
                  <Route
                    path="/seller/*"
                    element={
                      <PrivateRoute>
                        <SellerDashboard />
                      </PrivateRoute>
                    }
                  >
                    <Route path="products" element={<SellerProductsPage />} />
                    <Route path="products/add" element={<AddProductPage />} />
                    <Route path="orders" element={<SellerOrdersPage />} />
                    <Route path="analytics" element={<SellerAnalyticsPage />} />
                    <Route path="profile" element={<SellerStoreProfilePage />} />
                    <Route path="inventory" element={<SellerInventoryPage />} />
                    <Route path="promotions" element={<SellerPromotionPage />} />
                    <Route path="reports" element={<SellerReportsPage />} />
                    {/* Add more seller routes as needed */}
                  </Route>
                </Routes>
              </main>

              <Footer />

              {/* =====================
                  TOAST NOTIFICATIONS
              ===================== */}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </CartProvider>
        </AuthProvider>
      </AppProvider>
    </Router>
  );
}

export default App;
