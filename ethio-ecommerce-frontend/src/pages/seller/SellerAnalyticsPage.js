import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Badge, ProgressBar } from 'react-bootstrap';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/sellerAnalytics.css';

const SellerAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState({});

  const { formatPrice } = useApp();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data for seller
      const mockData = {
        overview: {
          totalRevenue: 45000,
          totalOrders: 34,
          averageOrderValue: 1323,
          conversionRate: 2.8
        },
        salesData: [
          { date: '2024-01-01', revenue: 1500, orders: 1 },
          { date: '2024-01-02', revenue: 2200, orders: 2 },
          { date: '2024-01-03', revenue: 1800, orders: 1 },
          { date: '2024-01-04', revenue: 3100, orders: 3 },
          { date: '2024-01-05', revenue: 1900, orders: 1 },
          { date: '2024-01-06', revenue: 4200, orders: 4 },
          { date: '2024-01-07', revenue: 2500, orders: 2 },
        ],
        topProducts: [
          { name: 'Product One', revenue: 15000, orders: 12, stock: 15 },
          { name: 'Product Two', revenue: 12000, orders: 8, stock: 3 },
          { name: 'Product Three', revenue: 8000, orders: 6, stock: 22 },
          { name: 'Product Four', revenue: 6000, orders: 5, stock: 7 },
          { name: 'Product Five', revenue: 4000, orders: 3, stock: 0 },
        ],
        customerMetrics: {
          newCustomers: 28,
          returningCustomers: 6,
          averageRating: 4.5,
          reviews: 18
        },
        orderStatus: [
          { status: 'delivered', count: 25, percentage: 73.5 },
          { status: 'processing', count: 5, percentage: 14.7 },
          { status: 'pending', count: 3, percentage: 8.8 },
          { status: 'cancelled', count: 1, percentage: 2.9 },
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockVariant = (stock) => {
    if (stock === 0) return 'danger';
    if (stock < 10) return 'warning';
    return 'success';
  };

  const getStatusVariant = (status) => {
    const variants = {
      delivered: 'success',
      processing: 'primary',
      pending: 'warning',
      cancelled: 'danger'
    };
    return variants[status] || 'secondary';
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  return (
    <Container fluid className="seller-analytics-container py-5">
      <div className="seller-analytics-topbar mb-4">
        <div>
          <h1 className="seller-analytics-title">Store Analytics</h1>
          <p className="seller-analytics-subtitle mb-0">Track your store performance</p>
        </div>
        <Form.Select
          className="seller-analytics-filter"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="1year">Last Year</option>
        </Form.Select>
      </div>

      {/* Overview Cards */}
      <Row className="seller-analytics-stats g-3 mb-4">
        <Col xl={3} md={6}>
          <Card className="seller-analytics-stat-card seller-analytics-stat-revenue">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="seller-analytics-stat-label">Total Revenue</h6>
                  <h3 className="seller-analytics-stat-value">{formatPrice(analyticsData.overview?.totalRevenue || 0)}</h3>
                  <small className="seller-analytics-trend-positive">
                    <i className="fas fa-arrow-up me-1"></i>
                    15.2% from last period
                  </small>
                </div>
                <div className="seller-analytics-stat-icon bg-primary-subtle">
                  <i className="fas fa-dollar-sign"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="seller-analytics-stat-card seller-analytics-stat-orders">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="seller-analytics-stat-label">Total Orders</h6>
                  <h3 className="seller-analytics-stat-value">{analyticsData.overview?.totalOrders || 0}</h3>
                  <small className="seller-analytics-trend-positive">
                    <i className="fas fa-arrow-up me-1"></i>
                    8.7% from last period
                  </small>
                </div>
                <div className="seller-analytics-stat-icon bg-success-subtle">
                  <i className="fas fa-shopping-bag"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="seller-analytics-stat-card seller-analytics-stat-aov">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="seller-analytics-stat-label">Avg Order Value</h6>
                  <h3 className="seller-analytics-stat-value">{formatPrice(analyticsData.overview?.averageOrderValue || 0)}</h3>
                  <small className="seller-analytics-trend-positive">
                    <i className="fas fa-arrow-up me-1"></i>
                    6.1% from last period
                  </small>
                </div>
                <div className="seller-analytics-stat-icon bg-warning-subtle">
                  <i className="fas fa-chart-line"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="seller-analytics-stat-card seller-analytics-stat-conversion">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="seller-analytics-stat-label">Conversion Rate</h6>
                  <h3 className="seller-analytics-stat-value">{analyticsData.overview?.conversionRate || 0}%</h3>
                  <small className="seller-analytics-trend-negative">
                    <i className="fas fa-arrow-down me-1"></i>
                    0.8% from last period
                  </small>
                </div>
                <div className="seller-analytics-stat-icon bg-info-subtle">
                  <i className="fas fa-percentage"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Products */}
        <Col lg={6} className="mb-4">
          <Card className="seller-analytics-panel">
            <Card.Header className="seller-analytics-panel-header">
              <h5 className="mb-0">Top Performing Products</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 seller-analytics-table">
                <thead className="seller-analytics-table-head">
                  <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topProducts?.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-semibold seller-analytics-product-name">{product.name}</div>
                      </td>
                      <td>
                        <strong className="seller-analytics-highlight">{formatPrice(product.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="info" className="seller-analytics-badge">{product.orders}</Badge>
                      </td>
                      <td>
                        <Badge bg={getStockVariant(product.stock)} className="seller-analytics-badge">
                          {product.stock}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Customer Metrics */}
        <Col lg={6} className="mb-4">
          <Card className="seller-analytics-panel">
            <Card.Header className="seller-analytics-panel-header">
              <h5 className="mb-0">Customer Analytics</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={6} className="mb-3">
                  <div className="seller-analytics-metric-box">
                    <h4 className="text-primary seller-analytics-metric-value">{analyticsData.customerMetrics?.newCustomers || 0}</h4>
                    <small className="seller-analytics-metric-label">New Customers</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="seller-analytics-metric-box">
                    <h4 className="text-success seller-analytics-metric-value">{analyticsData.customerMetrics?.returningCustomers || 0}</h4>
                    <small className="seller-analytics-metric-label">Returning Customers</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="seller-analytics-metric-box">
                    <h4 className="text-warning seller-analytics-metric-value">{analyticsData.customerMetrics?.averageRating || 0}/5</h4>
                    <small className="seller-analytics-metric-label">Average Rating</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="seller-analytics-metric-box">
                    <h4 className="text-info seller-analytics-metric-value">{analyticsData.customerMetrics?.reviews || 0}</h4>
                    <small className="seller-analytics-metric-label">Total Reviews</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Order Status Distribution */}
        <Col lg={6} className="mb-4">
          <Card className="seller-analytics-panel">
            <Card.Header className="seller-analytics-panel-header">
              <h5 className="mb-0">Order Status Distribution</h5>
            </Card.Header>
            <Card.Body>
              {analyticsData.orderStatus?.map((status, index) => (
                <div key={index} className="seller-analytics-status-row mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-capitalize">
                      <Badge bg={getStatusVariant(status.status)} className="seller-analytics-badge me-2">
                        {status.status}
                      </Badge>
                      {status.count} orders
                    </span>
                    <span className="seller-analytics-percentage">{status.percentage}%</span>
                  </div>
                  <ProgressBar
                    className="seller-analytics-progress"
                    variant={getStatusVariant(status.status)}
                    now={status.percentage}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Sales Activity */}
        <Col lg={6} className="mb-4">
          <Card className="seller-analytics-panel">
            <Card.Header className="seller-analytics-panel-header">
              <h5 className="mb-0">Recent Sales Activity</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 seller-analytics-table">
                <thead className="seller-analytics-table-head">
                  <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.salesData?.map((day, index) => (
                    <tr key={index}>
                      <td>
                        <small className="seller-analytics-date">{new Date(day.date).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <strong className="seller-analytics-highlight">{formatPrice(day.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="info" className="seller-analytics-badge">{day.orders}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row>
        <Col>
          <Card className="seller-analytics-panel">
            <Card.Header className="seller-analytics-panel-header">
              <h5 className="mb-0">Store Performance Metrics</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={3} className="mb-3">
                  <div className="seller-analytics-summary-card">
                    <h5 className="text-primary seller-analytics-summary-value">89%</h5>
                    <small className="seller-analytics-summary-label">Customer Satisfaction</small>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="seller-analytics-summary-card">
                    <h5 className="text-success seller-analytics-summary-value">2.3 Days</h5>
                    <small className="seller-analytics-summary-label">Avg Processing Time</small>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="seller-analytics-summary-card">
                    <h5 className="text-warning seller-analytics-summary-value">4.1%</h5>
                    <small className="seller-analytics-summary-label">Return Rate</small>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="seller-analytics-summary-card">
                    <h5 className="text-info seller-analytics-summary-value">95%</h5>
                    <small className="seller-analytics-summary-label">On-time Delivery</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerAnalyticsPage;