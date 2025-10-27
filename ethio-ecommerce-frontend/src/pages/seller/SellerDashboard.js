import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Nav } from 'react-bootstrap';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { productsAPI, ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';
import '../../styles/sellerDashboard.css';

const normalizeId = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (raw._id) return raw._id.toString();
    if (raw.id) return raw.id.toString();
    if (typeof raw.toString === 'function') {
      const stringified = raw.toString();
      if (stringified && stringified !== '[object Object]') {
        return stringified;
      }
    }
  }
  return null;
};

const itemBelongsToSeller = (item, sellerId) => {
  if (!sellerId || !item) return false;
  const sellerField = item.seller ?? item.product?.seller;
  const normalized = normalizeId(sellerField);
  return normalized === sellerId;
};

const SellerDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { formatPrice } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not seller
  React.useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      return;
    }

    if (user.role !== 'seller') {
      setLoading(false);
      return;
    }

    const sellerId = user._id;
    if (!sellerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [ordersResponse, productsResponse] = await Promise.all([
        ordersAPI.getOrders(),
        productsAPI.getProducts({ seller: sellerId, limit: 100 })
      ]);

      const ordersPayload = ordersResponse?.data?.data;
      const allOrders = Array.isArray(ordersPayload) ? ordersPayload : [];

      const productsPayload = productsResponse?.data?.data;
      const sellerProducts = Array.isArray(productsPayload)
        ? productsPayload
        : Array.isArray(productsResponse?.data)
          ? productsResponse.data
          : [];

      const ordersForSeller = allOrders
        .map(order => {
          const sellerItems = (order.items || []).filter(item => itemBelongsToSeller(item, sellerId));
          if (!sellerItems.length) return null;

          const sellerTotal = sellerItems.reduce((total, item) => {
            const subtotal = typeof item.subtotal === 'number'
              ? item.subtotal
              : (item.price || 0) * (item.quantity || 0);
            return total + subtotal;
          }, 0);

          return {
            ...order,
            sellerItems,
            sellerTotal
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const pendingStatuses = ['pending', 'confirmed', 'processing'];

      const totalRevenue = ordersForSeller.reduce((sum, order) => sum + order.sellerTotal, 0);
      const totalOrders = ordersForSeller.length;
      const pendingOrders = ordersForSeller.filter(order => pendingStatuses.includes(order.status)).length;
      const totalProducts = sellerProducts.length;
      const averageRating = totalProducts
        ? Number((sellerProducts.reduce((sum, product) => sum + (product?.ratings?.average || 0), 0) / totalProducts).toFixed(2))
        : 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        pendingOrders,
        averageRating
      });

      setRecentOrders(ordersForSeller.slice(0, 5));
      setProducts(sellerProducts);
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const alertsCount = useMemo(
    () => products.filter(product => Number(product.stock) < 5).length,
    [products]
  );

  const displayProducts = useMemo(() => products.slice(0, 5), [products]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (!user || user.role !== 'seller') {
    return <Message variant="danger">Access denied. Seller privileges required.</Message>;
  }

  // If we're on a sub-route, render the outlet
  if (location.pathname !== '/seller') {
    return <Outlet />;
  }

  return (
    <Container fluid className="py-5 seller-dashboard-container">
      <Row className="seller-dashboard-row">
        <Col md={3} lg={2} className="seller-sidebar">
          <Card className="seller-sidebar-card shadow-sm">
            <Card.Header className="seller-sidebar-header">
              <h6 className="mb-0">Seller Menu</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column seller-sidebar-nav">
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller" 
                    active={location.pathname === '/seller'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/products"
                    active={location.pathname === '/seller/products'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-box me-2"></i>
                    Products
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/orders"
                    active={location.pathname === '/seller/orders'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-shopping-bag me-2"></i>
                    Orders
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/analytics"
                    active={location.pathname === '/seller/analytics'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Analytics
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/inventory"
                    active={location.pathname === '/seller/inventory'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-warehouse me-2"></i>
                    Inventory Control
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/promotions"
                    active={location.pathname === '/seller/promotions'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-tags me-2"></i>
                    Promotions
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/reports"
                    active={location.pathname === '/seller/reports'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    Reports
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/profile"
                    active={location.pathname === '/seller/profile'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-store me-2"></i>
                    Store Profile
                  </Nav.Link>
                </Nav.Item>

                {/* Add this navigation item for Inventory Alerts */}
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/seller/alerts"
                    active={location.pathname === '/seller/alerts'}
                    className="seller-nav-link"
                  >
                    <i className="fas fa-bell me-2"></i>
                    Inventory Alerts
                    {alertsCount > 0 && (
                      <Badge bg="danger" className="ms-2 seller-alert-badge">
                        {alertsCount}
                      </Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9} lg={10} className="seller-main">
          {/* Welcome Header */}
          <Card className="mb-4 seller-welcome-card">
            <Card.Body className="seller-welcome-body">
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-1 seller-welcome-title">Welcome back, {user.name}!</h4>
                  <p className="mb-0 seller-welcome-subtitle">Here's what's happening with your store today.</p>
                </Col>
                <Col xs="auto">
                  <Button className="seller-add-button" onClick={() => navigate('/seller/products/add')}>
                    <i className="fas fa-plus me-2"></i>
                    Add New Product
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {error && (
            <Message variant="danger" className="mb-4">
              {error}
            </Message>
          )}

          {/* Stats Cards */}
          <Row className="mb-4 g-3 seller-stats-row">
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-revenue">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">{formatPrice(stats.totalRevenue || 0)}</h4>
                  <small className="seller-stat-label">Total Revenue</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-orders">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">{stats.totalOrders || 0}</h4>
                  <small className="seller-stat-label">Total Orders</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-products">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">{stats.totalProducts || 0}</h4>
                  <small className="seller-stat-label">Products</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-pending">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">{stats.pendingOrders || 0}</h4>
                  <small className="seller-stat-label">Pending Orders</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-rating">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">{stats.averageRating || 0}</h4>
                  <small className="seller-stat-label">Avg Rating</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={2} md={4} sm={6}>
              <Card className="seller-stat-card seller-stat-alerts">
                <Card.Body className="text-center">
                  <h4 className="seller-stat-value">
                    {alertsCount}
                  </h4>
                  <small className="seller-stat-label">Low Stock</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Orders */}
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="seller-panel">
                <Card.Header className="d-flex justify-content-between align-items-center seller-panel-header">
                  <h5 className="mb-0">Recent Orders</h5>
                  <Link to="/seller/orders" className="btn btn-sm btn-primary seller-panel-cta">
                    View All
                  </Link>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 seller-table">
                    <thead className="bg-light seller-table-head">
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              No recent orders for your products yet.
                            </td>
                          </tr>
                        ) : (
                          recentOrders.map(order => (
                            <tr key={order._id}>
                              <td>
                                <Link to={`/seller/orders/${order._id}`} className="text-decoration-none">
                                  {order.orderNumber}
                                </Link>
                              </td>
                              <td>{order.customer?.name || 'Customer'}</td>
                              <td>{formatPrice(order.sellerTotal)}</td>
                              <td>
                                <Badge bg={
                                  order.status === 'delivered' ? 'success' :
                                  order.status === 'cancelled' ? 'danger' :
                                  order.status === 'pending' ? 'warning' : 'primary'
                                }>
                                  {order.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Product Overview */}
            <Col lg={6} className="mb-4">
              <Card className="seller-panel">
                <Card.Header className="d-flex justify-content-between align-items-center seller-panel-header">
                  <h5 className="mb-0">Product Overview</h5>
                  <Link to="/seller/products" className="btn btn-sm btn-primary seller-panel-cta">
                    Manage
                  </Link>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 seller-table">
                    <thead className="bg-light seller-table-head">
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            No products found. Add your first product to get started.
                          </td>
                        </tr>
                      ) : (
                        displayProducts.map(product => (
                          <tr key={product._id}>
                            <td>{product.name?.en || product.name}</td>
                            <td>{formatPrice(product.price)}</td>
                            <td>
                              <Badge bg={Number(product.stock) < 5 ? 'warning' : 'success'}>
                                {product.stock}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={product.status === 'active' ? 'success' : 'secondary'}>
                                {product.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row>
            <Col>
              <Card className="seller-panel seller-actions-panel">
                <Card.Header className="seller-panel-header">
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3} className="text-center">
                      <Button
                        variant="outline-primary"
                        className="w-100 h-100 py-3 seller-quick-action"
                        onClick={() => navigate('/seller/products/add')}
                      >
                        <i className="fas fa-plus fa-2x mb-2 d-block"></i>
                        Add Product
                      </Button>
                    </Col>
                    <Col md={3} className="text-center">
                      <Button
                        variant="outline-success"
                        className="w-100 h-100 py-3 seller-quick-action"
                        onClick={() => navigate('/seller/inventory')}
                      >
                        <i className="fas fa-edit fa-2x mb-2 d-block"></i>
                        Update Inventory
                      </Button>
                    </Col>
                    <Col md={3} className="text-center">
                      <Button
                        variant="outline-warning"
                        className="w-100 h-100 py-3 seller-quick-action"
                        onClick={() => navigate('/seller/promotions')}
                      >
                        <i className="fas fa-tags fa-2x mb-2 d-block"></i>
                        Create Promotion
                      </Button>
                    </Col>
                    <Col md={3} className="text-center">
                      <Button
                        variant="outline-info"
                        className="w-100 h-100 py-3 seller-quick-action"
                        onClick={() => navigate('/seller/reports')}
                      >
                        <i className="fas fa-chart-line fa-2x mb-2 d-block"></i>
                        View Reports
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerDashboard;
