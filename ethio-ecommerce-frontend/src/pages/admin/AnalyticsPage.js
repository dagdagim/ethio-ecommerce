import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Badge } from 'react-bootstrap';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';
import { adminAPI } from '../../services/api';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState({});
  const [error, setError] = useState(null);

  const { formatPrice } = useApp();

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminAPI.getAnalyticsOverview({ range: timeRange });
        if (!isMounted) return;
        setAnalyticsData(response.data?.data || {});
      } catch (err) {
        console.error('Error fetching analytics:', err);
        const message = err.response?.data?.message || 'Failed to load analytics data.';
        if (isMounted) {
          setError(message);
          setAnalyticsData({});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const getGrowthVariant = (growth) => {
    if (!Number.isFinite(growth)) return 'secondary';
    if (growth > 15) return 'success';
    if (growth >= 0) return 'warning';
    return 'danger';
  };

  const getChangeDetails = (value) => {
    if (!Number.isFinite(value) || value === null) {
      return {
        icon: 'fas fa-minus',
        className: 'text-muted',
        text: 'No previous data'
      };
    }

    if (value === 0) {
      return {
        icon: 'fas fa-minus',
        className: 'text-muted',
        text: 'No change vs previous period'
      };
    }

    const isPositive = value > 0;
    return {
      icon: isPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down',
      className: isPositive ? 'text-success' : 'text-danger',
      text: `${Math.abs(value).toFixed(1)}% ${isPositive ? 'increase' : 'decrease'} vs previous period`
    };
  };

  const formatPercentage = (value, fractionDigits = 1) => {
    if (!Number.isFinite(value)) {
      return '0%';
    }
    return `${value.toFixed(fractionDigits)}%`;
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const overview = analyticsData.overview || {};
  const periodComparison = analyticsData.periodComparison || {};
  const topProducts = analyticsData.topProducts || [];
  const salesData = analyticsData.salesData || [];
  const customerMetrics = analyticsData.customerMetrics || {};
  const paymentMethods = analyticsData.paymentMethods || [];
  const additionalMetrics = analyticsData.additionalMetrics || {};
  const revenueChangeDetails = getChangeDetails(periodComparison.totalRevenue);
  const ordersChangeDetails = getChangeDetails(periodComparison.totalOrders);
  const averageOrderValueChangeDetails = getChangeDetails(periodComparison.averageOrderValue);
  const conversionChangeDetails = getChangeDetails(periodComparison.conversionRate);

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Sales Analytics</h1>
          <p className="text-muted mb-0">Track your business performance</p>
        </div>
        <Form.Select 
          style={{ width: '200px' }}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="1year">Last Year</option>
        </Form.Select>
      </div>

      {error && (
        <Row className="mb-4">
          <Col>
            <Message variant="danger">{error}</Message>
          </Col>
        </Row>
      )}

      const overview = analyticsData.overview || {};
      const periodComparison = analyticsData.periodComparison || {};
      const topProducts = analyticsData.topProducts || [];
      const salesData = analyticsData.salesData || [];
      const customerMetrics = analyticsData.customerMetrics || {};
      const paymentMethods = analyticsData.paymentMethods || [];
      const additionalMetrics = analyticsData.additionalMetrics || {};

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6}>
          <Card className="border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Revenue</h6>
                  <h3>{formatPrice(overview.totalRevenue || 0)}</h3>
                  <small className={revenueChangeDetails.className}>
                    <i className={`${revenueChangeDetails.icon} me-1`}></i>
                    {revenueChangeDetails.text}
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-dollar-sign fa-2x text-primary"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-success">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Orders</h6>
                  <h3>{overview.totalOrders || 0}</h3>
                  <small className={ordersChangeDetails.className}>
                    <i className={`${ordersChangeDetails.icon} me-1`}></i>
                    {ordersChangeDetails.text}
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-shopping-bag fa-2x text-success"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-warning">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Avg Order Value</h6>
                  <h3>{formatPrice(overview.averageOrderValue || 0)}</h3>
                  <small className={averageOrderValueChangeDetails.className}>
                    <i className={`${averageOrderValueChangeDetails.icon} me-1`}></i>
                    {averageOrderValueChangeDetails.text}
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-chart-line fa-2x text-warning"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-info">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Conversion Rate</h6>
                  <h3>{formatPercentage(overview.conversionRate || 0)}</h3>
                  <small className={conversionChangeDetails.className}>
                    <i className={`${conversionChangeDetails.icon} me-1`}></i>
                    {conversionChangeDetails.text}
                  </small>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-percentage fa-2x text-info"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Products */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Top Performing Products</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No product performance data for this period.
                      </td>
                    </tr>
                  )}
                  {topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                      </td>
                      <td>
                        <strong>{formatPrice(product.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="info">{product.orders}</Badge>
                      </td>
                      <td>
                        <Badge bg={getGrowthVariant(product.growth)}>
                          {Number.isFinite(product.growth)
                            ? `${product.growth >= 0 ? '+' : '-'}${Math.abs(product.growth).toFixed(1)}%`
                            : 'N/A'}
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
          <Card>
            <Card.Header>
              <h5 className="mb-0">Customer Analytics</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-primary">{customerMetrics.newCustomers || 0}</h4>
                    <small className="text-muted">New Customers</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-success">{customerMetrics.returningCustomers || 0}</h4>
                    <small className="text-muted">Returning Customers</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4>{formatPrice(customerMetrics.customerAcquisitionCost || 0)}</h4>
                    <small className="text-muted">CAC</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4>{formatPrice(customerMetrics.customerLifetimeValue || 0)}</h4>
                    <small className="text-muted">LTV</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Payment Methods */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Payment Method Distribution</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Orders</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">
                        No payments recorded for this period.
                      </td>
                    </tr>
                  )}
                  {paymentMethods.map((method, index) => (
                    <tr key={index}>
                      <td>
                        <Badge 
                          bg={
                            method.method === 'TeleBirr' ? 'primary' :
                            method.method === 'Cash on Delivery' ? 'success' : 'info'
                          }
                        >
                          {method.method}
                        </Badge>
                      </td>
                      <td>{method.count}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="progress flex-grow-1 me-2" 
                            style={{ height: '8px' }}
                          >
                            <div 
                              className="progress-bar" 
                              style={{ width: `${method.percentage}%` }}
                            ></div>
                          </div>
                          <span>{method.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Sales */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Sales Activity</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">
                        No sales activity in the selected period.
                      </td>
                    </tr>
                  )}
                  {salesData.map((day, index) => (
                    <tr key={index}>
                      <td>
                        <small>{new Date(day.date).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <strong>{formatPrice(day.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="info">{day.orders}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Row */}
      <Row>
        <Col md={4}>
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <h4>{formatPercentage(additionalMetrics.customerSatisfaction || 0)}</h4>
              <small>Customer Satisfaction</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-success text-white">
            <Card.Body className="text-center">
              <h4>
                {Number.isFinite(additionalMetrics.averageDeliveryTime)
                  ? `${additionalMetrics.averageDeliveryTime.toFixed(1)} Days`
                  : 'N/A'}
              </h4>
              <small>Average Delivery Time</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-warning text-white">
            <Card.Body className="text-center">
              <h4>{formatPercentage(additionalMetrics.returnRate || 0)}</h4>
              <small>Return Rate</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AnalyticsPage;