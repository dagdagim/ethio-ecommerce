import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Badge, Button } from 'react-bootstrap';
import { analyticsAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdvancedAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState({});
  const [activeChart, setActiveChart] = useState('revenue');

  const { formatPrice } = useApp();

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [timeRange]);

  const fetchAdvancedAnalytics = async () => {
    try {
      // Mock advanced analytics data
      const mockData = {
        // Revenue Analytics
        revenue: {
          total: 125000,
          growth: 12.5,
          dailyAverage: 4166,
          byChannel: [
            { channel: 'Direct', amount: 75000, percentage: 60 },
            { channel: 'Organic Search', amount: 25000, percentage: 20 },
            { channel: 'Social Media', amount: 15000, percentage: 12 },
            { channel: 'Email', amount: 10000, percentage: 8 }
          ]
        },

        // Customer Analytics
        customers: {
          total: 89,
          new: 45,
          returning: 44,
          acquisitionCost: 120,
          lifetimeValue: 840,
          retentionRate: 72.5
        },

        // Product Performance
        products: {
          topPerforming: [
            { name: 'Smartphone X', revenue: 25000, units: 15, conversion: 8.2 },
            { name: 'Laptop Pro', revenue: 18000, units: 8, conversion: 6.5 },
            { name: 'Wireless Earbuds', revenue: 12000, units: 25, conversion: 12.3 },
            { name: 'Smart Watch', revenue: 9500, units: 12, conversion: 7.8 },
            { name: 'Tablet Mini', revenue: 7800, units: 7, conversion: 5.2 }
          ],
          slowMoving: [
            { name: 'Old Model Phone', revenue: 1200, units: 2, conversion: 1.2 },
            { name: 'Basic Headphones', revenue: 800, units: 4, conversion: 2.1 },
            { name: 'Camera Accessory', revenue: 600, units: 1, conversion: 0.8 }
          ]
        },

        // Sales Funnel
        salesFunnel: {
          visitors: 1250,
          addedToCart: 312,
          reachedCheckout: 156,
          completedPurchase: 89,
          conversionRate: 7.12
        },

        // Geographic Data
        geographic: [
          { region: 'Addis Ababa', revenue: 75000, orders: 45 },
          { region: 'Oromia', revenue: 25000, orders: 18 },
          { region: 'Amhara', revenue: 15000, orders: 12 },
          { region: 'SNNPR', revenue: 8000, orders: 8 },
          { region: 'Tigray', revenue: 2000, orders: 3 }
        ],

        // Customer Behavior
        behavior: {
          averageSession: '4m 23s',
          bounceRate: 42.3,
          pagesPerSession: 3.8,
          returningFrequency: '12 days'
        },

        // Predictive Analytics
        predictions: {
          nextMonthRevenue: 135000,
          growthTrend: 'up',
          stockRecommendations: [
            { product: 'Wireless Earbuds', action: 'restock', current: 8, recommended: 25 },
            { product: 'Smartphone X', action: 'maintain', current: 15, recommended: 20 },
            { product: 'Old Model Phone', action: 'clearance', current: 12, recommended: 0 }
          ]
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthVariant = (growth) => {
    if (growth > 10) return 'success';
    if (growth > 0) return 'warning';
    return 'danger';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 'fas fa-arrow-up text-success' : 'fas fa-arrow-down text-danger';
  };

  if (loading) return <LoadingSpinner message="Loading advanced analytics..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Advanced Analytics</h1>
          <p className="text-muted mb-0">Deep insights into your business performance</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select 
            style={{ width: '200px' }}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
            <option value="custom">Custom Range</option>
          </Form.Select>
        </div>
      </div>

      {/* KPI Overview */}
      <Row className="mb-4">
        <Col xl={3} md={6}>
          <Card className="border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Revenue</h6>
                  <h3>{formatPrice(analyticsData.revenue?.total || 0)}</h3>
                  <Badge bg={getGrowthVariant(analyticsData.revenue?.growth)}>
                    <i className={getTrendIcon('up')}></i> {analyticsData.revenue?.growth}%
                  </Badge>
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
                  <h6 className="text-muted">Total Customers</h6>
                  <h3>{analyticsData.customers?.total || 0}</h3>
                  <Badge bg="success">
                    {analyticsData.customers?.new || 0} new
                  </Badge>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-users fa-2x text-success"></i>
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
                  <h6 className="text-muted">Conversion Rate</h6>
                  <h3>{analyticsData.salesFunnel?.conversionRate || 0}%</h3>
                  <Badge bg="warning">
                    {analyticsData.salesFunnel?.completedPurchase || 0} purchases
                  </Badge>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-percentage fa-2x text-warning"></i>
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
                  <h6 className="text-muted">Avg. Order Value</h6>
                  <h3>{formatPrice(analyticsData.revenue?.total / analyticsData.salesFunnel?.completedPurchase || 0)}</h3>
                  <Badge bg="info">
                    LTV: {formatPrice(analyticsData.customers?.lifetimeValue || 0)}
                  </Badge>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-shopping-bag fa-2x text-info"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Sales Funnel */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Sales Funnel Analysis</h5>
            </Card.Header>
            <Card.Body>
              <div className="funnel-container">
                <div className="funnel-stage visitors">
                  <div className="funnel-label">Visitors</div>
                  <div className="funnel-value">{analyticsData.salesFunnel?.visitors}</div>
                  <div className="funnel-bar" style={{ width: '100%' }}></div>
                </div>
                <div className="funnel-stage cart">
                  <div className="funnel-label">Added to Cart</div>
                  <div className="funnel-value">{analyticsData.salesFunnel?.addedToCart}</div>
                  <div className="funnel-bar" style={{ 
                    width: `${(analyticsData.salesFunnel?.addedToCart / analyticsData.salesFunnel?.visitors) * 100}%` 
                  }}></div>
                </div>
                <div className="funnel-stage checkout">
                  <div className="funnel-label">Reached Checkout</div>
                  <div className="funnel-value">{analyticsData.salesFunnel?.reachedCheckout}</div>
                  <div className="funnel-bar" style={{ 
                    width: `${(analyticsData.salesFunnel?.reachedCheckout / analyticsData.salesFunnel?.addedToCart) * 100}%` 
                  }}></div>
                </div>
                <div className="funnel-stage purchase">
                  <div className="funnel-label">Completed Purchase</div>
                  <div className="funnel-value">{analyticsData.salesFunnel?.completedPurchase}</div>
                  <div className="funnel-bar" style={{ 
                    width: `${(analyticsData.salesFunnel?.completedPurchase / analyticsData.salesFunnel?.reachedCheckout) * 100}%` 
                  }}></div>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <Badge bg="primary" className="fs-6">
                  Overall Conversion Rate: {analyticsData.salesFunnel?.conversionRate}%
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Revenue by Channel */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Revenue by Channel</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  {analyticsData.revenue?.byChannel?.map((channel, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="color-indicator me-2"
                            style={{ 
                              backgroundColor: [
                                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'
                              ][index],
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px'
                            }}
                          ></div>
                          <span>{channel.channel}</span>
                        </div>
                      </td>
                      <td className="text-end">
                        {formatPrice(channel.amount)}
                      </td>
                      <td className="text-end" style={{ width: '80px' }}>
                        <Badge bg="light" text="dark">
                          {channel.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="mt-3">
                <div className="progress" style={{ height: '20px' }}>
                  {analyticsData.revenue?.byChannel?.map((channel, index) => (
                    <div
                      key={index}
                      className="progress-bar"
                      style={{
                        width: `${channel.percentage}%`,
                        backgroundColor: [
                          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'
                        ][index]
                      }}
                      title={`${channel.channel}: ${channel.percentage}%`}
                    ></div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Performing Products */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Performing Products</h5>
              <Badge bg="success">{analyticsData.products?.topPerforming?.length || 0} products</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>Units</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.products?.topPerforming?.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                      </td>
                      <td>
                        <strong>{formatPrice(product.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="info">{product.units}</Badge>
                      </td>
                      <td>
                        <Badge bg={product.conversion > 8 ? 'success' : 'warning'}>
                          {product.conversion}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Geographic Distribution */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Geographic Distribution</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Region</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Avg. Order</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.geographic?.map((region, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-semibold">{region.region}</div>
                      </td>
                      <td>
                        <strong>{formatPrice(region.revenue)}</strong>
                      </td>
                      <td>
                        <Badge bg="primary">{region.orders}</Badge>
                      </td>
                      <td>
                        {formatPrice(region.revenue / region.orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Customer Insights */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Customer Insights</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={4} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-primary">{analyticsData.customers?.retentionRate}%</h4>
                    <small className="text-muted">Retention Rate</small>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-success">{analyticsData.behavior?.averageSession}</h4>
                    <small className="text-muted">Avg. Session</small>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-warning">{analyticsData.behavior?.pagesPerSession}</h4>
                    <small className="text-muted">Pages/Session</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-info">{analyticsData.customers?.acquisitionCost}</h4>
                    <small className="text-muted">CAC (ETB)</small>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-secondary">{analyticsData.behavior?.returningFrequency}</h4>
                    <small className="text-muted">Return Frequency</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Predictive Analytics */}
        <Col lg={6} className="mb-4">
          <Card className="border-warning">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Predictive Insights
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Next Month Revenue Forecast</h6>
                <div className="d-flex align-items-center">
                  <h4 className="text-warning mb-0">
                    {formatPrice(analyticsData.predictions?.nextMonthRevenue)}
                  </h4>
                  <Badge bg="success" className="ms-2">
                    <i className={getTrendIcon('up')}></i> 8% increase
                  </Badge>
                </div>
              </div>

              <div className="mb-3">
                <h6>Stock Recommendations</h6>
                {analyticsData.predictions?.stockRecommendations?.map((rec, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <span>{rec.product}</span>
                    <div>
                      <Badge 
                        bg={
                          rec.action === 'restock' ? 'success' :
                          rec.action === 'maintain' ? 'warning' : 'danger'
                        }
                        className="me-2"
                      >
                        {rec.action}
                      </Badge>
                      <small className="text-muted">
                        {rec.current} → {rec.recommended}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button variant="outline-warning" size="sm">
                  <i className="fas fa-download me-2"></i>
                  Download Full Report
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Performance Metrics</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-primary fw-bold">{analyticsData.revenue?.dailyAverage}</div>
                    <small className="text-muted">Daily Revenue</small>
                  </div>
                </Col>
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-success fw-bold">{analyticsData.customers?.new}</div>
                    <small className="text-muted">New Customers</small>
                  </div>
                </Col>
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-info fw-bold">{analyticsData.customers?.returning}</div>
                    <small className="text-muted">Returning Customers</small>
                  </div>
                </Col>
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-warning fw-bold">{analyticsData.behavior?.bounceRate}%</div>
                    <small className="text-muted">Bounce Rate</small>
                  </div>
                </Col>
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-danger fw-bold">42.1%</div>
                    <small className="text-muted">Cart Abandonment</small>
                  </div>
                </Col>
                <Col md={2} sm={4} className="mb-3">
                  <div className="border rounded p-2">
                    <div className="text-secondary fw-bold">4.2/5</div>
                    <small className="text-muted">Avg. Rating</small>
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

export default AdvancedAnalyticsPage;