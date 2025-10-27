import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Nav } from 'react-bootstrap';
import '../../styles/admin.css';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ordersAPI, productsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatPrice } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        ordersAPI.getOrders(),
        productsAPI.getProducts({ limit: 100 }),
      ]);

      const orders = ordersResponse.data.data;
      const products = productsResponse.data.data;

      // Calculate stats
      const totalRevenue = orders
        .filter((order) => order.paymentStatus === 'completed')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const pendingOrders = orders.filter((order) =>
        ['pending', 'confirmed', 'processing'].includes(order.status)
      ).length;

      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        totalRevenue,
        pendingOrders,
        totalCustomers: new Set(orders.map((order) => order.customer?._id)).size,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (!user || user.role !== 'admin') {
    return (
      <Message variant="danger">
        Access denied. Admin privileges required.
      </Message>
    );
  }

  return (
    <Container fluid className="admin-dashboard py-4">
      <Row>
        {/* Sidebar Menu */}
        <Col md={3} lg={2}>
          <Card className="admin-sidebar glass-card">
            <Card.Header className="sidebar-header">
              <h6 className="mb-0">Admin Menu</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column sidebar-nav">
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    active={location.pathname === '/admin'}
                  >
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin/orders"
                    active={location.pathname === '/admin/orders'}
                  >
                    <i className="fas fa-shopping-bag me-2"></i>
                    Orders
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin/products"
                    active={location.pathname === '/admin/products'}
                  >
                    <i className="fas fa-box me-2"></i>
                    Products
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin/categories"
                    active={location.pathname === '/admin/categories'}
                  >
                    <i className="fas fa-tags me-2"></i>
                    Categories
                  </Nav.Link>
                </Nav.Item>

                {/* ✅ Added Users */}
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin/users"
                    active={location.pathname === '/admin/users'}
                  >
                    <i className="fas fa-users me-2"></i>
                    Users
                  </Nav.Link>
                </Nav.Item>

                {/* ✅ Added Analytics */}
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/admin/analytics"
                    active={location.pathname === '/admin/analytics'}
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Analytics
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* ✅ Conditional Main Area */}
        <Col md={9} lg={10}>
          {location.pathname === '/admin' ? (
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header mb-4">
                <h1 className="mb-1">Admin Dashboard</h1>
                <p className="text-muted mb-0">Overview & quick actions for your store</p>
              </div>
              {/* Dashboard Stats */}
              <Row className="mb-4 dashboard-stats-row">
                <Col xl={3} md={6}>
                  <Card className="dashboard-stat glass-card stat-revenue">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted">Total Revenue</h6>
                          <h2 className="stat-value">{formatPrice(stats.totalRevenue || 0)}</h2>
                        </div>
                        <div className="stat-icon">
                          <i className="fas fa-dollar-sign fa-2x text-primary"></i>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="dashboard-stat glass-card stat-orders">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted">Total Orders</h6>
                          <h2 className="stat-value">{stats.totalOrders || 0}</h2>
                        </div>
                        <div className="stat-icon">
                          <i className="fas fa-shopping-bag fa-2x text-success"></i>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="dashboard-stat glass-card stat-pending">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted">Pending Orders</h6>
                          <h2 className="stat-value">{stats.pendingOrders || 0}</h2>
                        </div>
                        <div className="stat-icon">
                          <i className="fas fa-clock fa-2x text-warning"></i>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="dashboard-stat glass-card stat-products">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted">Total Products</h6>
                          <h2 className="stat-value">{stats.totalProducts || 0}</h2>
                        </div>
                        <div className="stat-icon">
                          <i className="fas fa-box fa-2x text-info"></i>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recent Orders */}
              <Row>
                <Col lg={8}>
                  <Card className="glass-card recent-orders-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Recent Orders</h5>
                      <Link to="/admin/orders" className="btn btn-sm btn-primary">
                        View All
                      </Link>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0 recent-orders-table">
                        <thead className="bg-light">
                          <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order._id}>
                              <td>
                                <Link
                                  to={`/admin/orders/${order._id}`}
                                  className="text-decoration-none"
                                >
                                  {order.orderNumber}
                                </Link>
                              </td>
                              <td>{order.customer?.name || 'N/A'}</td>
                              <td>{formatPrice(order.totalAmount)}</td>
                              <td>
                                <Badge
                                  bg={
                                    order.status === 'delivered'
                                      ? 'success'
                                      : order.status === 'cancelled'
                                      ? 'danger'
                                      : order.status === 'pending'
                                      ? 'warning'
                                      : 'primary'
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </td>
                              <td>
                                <small>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="glass-card quick-actions-card">
                    <Card.Header>
                      <h5 className="mb-0">Quick Actions</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Link to="/admin/products/new" className="btn btn-primary">
                          <i className="fas fa-plus me-2"></i>
                          Add New Product
                        </Link>
                        <Link
                          to="/admin/categories/new"
                          className="btn btn-outline-primary"
                        >
                          <i className="fas fa-tag me-2"></i>
                          Manage Categories
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="btn btn-outline-success"
                        >
                          <i className="fas fa-shopping-bag me-2"></i>
                          Process Orders
                        </Link>
                        <Link to="/admin/users" className="btn btn-outline-info">
                          <i className="fas fa-users me-2"></i>
                          Manage Users
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <Outlet /> // ✅ Render nested admin pages here
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
