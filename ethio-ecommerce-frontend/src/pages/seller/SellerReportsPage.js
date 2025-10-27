import React, { useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Table, ProgressBar, Button } from 'react-bootstrap';

const revenueSeed = [
  { id: 'rev-jan', label: 'January', value: 42000, growth: 12 },
  { id: 'rev-feb', label: 'February', value: 48000, growth: 14 },
  { id: 'rev-mar', label: 'March', value: 51200, growth: 7 },
  { id: 'rev-apr', label: 'April', value: 55800, growth: 9 }
];

const fulfillmentSeed = [
  { id: 'ful-1', metric: 'On-Time Delivery', value: 94 },
  { id: 'ful-2', metric: 'Perfect Order Rate', value: 88 },
  { id: 'ful-3', metric: 'Return Rate', value: 6 }
];

const topProductsSeed = [
  { id: 'top-1', name: 'Addis Coffee Beans 1kg', orders: 126, revenue: 18900, contribution: 24 },
  { id: 'top-2', name: 'Shega Leather Tote', orders: 78, revenue: 31200, contribution: 19 },
  { id: 'top-3', name: 'Abay Smart Watch', orders: 65, revenue: 45500, contribution: 31 }
];

const SellerReportsPage = () => {
  const totalRevenue = useMemo(() => revenueSeed.reduce((acc, entry) => acc + entry.value, 0), []);
  const avgGrowth = useMemo(() => {
    if (revenueSeed.length === 0) return 0;
    const totalGrowth = revenueSeed.reduce((acc, entry) => acc + entry.growth, 0);
    return (totalGrowth / revenueSeed.length).toFixed(1);
  }, []);

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="fw-semibold mb-1">Performance Reports</h2>
          <p className="text-muted mb-0">
            Track sales momentum, fulfillment health, and hero products to steer your next move.
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" className="shadow-sm">
            <i className="fas fa-download me-2"></i>
            Export PDF
          </Button>
          <Button variant="outline-primary" className="shadow-sm">
            <i className="fas fa-envelope-open-text me-2"></i>
            Email Summary
          </Button>
        </Col>
      </Row>

      <Row className="g-4 mb-1">
        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="text-muted">Quarter-to-Date Revenue</h6>
              <h3 className="fw-semibold">ETB {totalRevenue.toLocaleString()}</h3>
              <Badge bg="success" className="mt-2">
                <i className="fas fa-arrow-trend-up me-1"></i>
                {avgGrowth}% avg growth
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="text-muted">Active Customers</h6>
              <h3 className="fw-semibold">2,185</h3>
              <small className="text-muted">+18% vs last quarter</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="text-muted">Average Order Value</h6>
              <h3 className="fw-semibold">ETB 1,820</h3>
              <small className="text-muted">Tracking at +9% month over month</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={7}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Revenue Trend</h5>
                <small className="text-muted">Momentum across the current season</small>
              </div>
              <Badge bg="info" text="dark">Quarter view</Badge>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Growth</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueSeed.map(entry => (
                    <tr key={entry.id}>
                      <td className="fw-semibold">{entry.label}</td>
                      <td>ETB {entry.value.toLocaleString()}</td>
                      <td>
                        <Badge bg={entry.growth >= 10 ? 'success' : 'warning'}>
                          {entry.growth}%
                        </Badge>
                      </td>
                      <td>
                        <ProgressBar
                          now={entry.growth * 4}
                          variant={entry.growth >= 10 ? 'success' : 'warning'}
                          label={`+${entry.growth}%`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Fulfillment Quality</h5>
            </Card.Header>
            <Card.Body>
              {fulfillmentSeed.map(entry => (
                <div key={entry.id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold">{entry.metric}</span>
                    <span>{entry.value}%</span>
                  </div>
                  <ProgressBar
                    now={entry.value}
                    variant={entry.metric === 'Return Rate' ? 'danger' : entry.value >= 90 ? 'success' : 'warning'}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Performing Products</h5>
              <Badge bg="primary">Live</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Mix</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsSeed.map(entry => (
                    <tr key={entry.id}>
                      <td className="fw-semibold">{entry.name}</td>
                      <td>{entry.orders}</td>
                      <td>ETB {entry.revenue.toLocaleString()}</td>
                      <td>
                        <ProgressBar now={entry.contribution} label={`${entry.contribution}%`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerReportsPage;
