import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ordersAPI, paymentsAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { useCart } from '../contexts/CartContext';
import CheckoutSteps from '../components/checkout/CheckoutSteps';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OrderPaymentPage = () => {
  const { id: orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useApp();
  const { clearCart } = useCart();

  const navigationState = location.state || {};

  const [order, setOrder] = useState(navigationState.order || null);
  const [selectedMethod, setSelectedMethod] = useState(
    navigationState.paymentMethod || navigationState.order?.paymentMethod || ''
  );
  const [loadingOrder, setLoadingOrder] = useState(!navigationState.order);
  const [processingMethod, setProcessingMethod] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState(
    navigationState.telebirrPhone || navigationState.order?.shippingAddress?.phone || ''
  );
  const [telebirrInfo, setTelebirrInfo] = useState(null);
  const [chapaInfo, setChapaInfo] = useState(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    transferDate: '',
    referenceNumber: ''
  });
  const [bankSuccessMessage, setBankSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const refreshOrder = useCallback(
    async (showSpinner = false) => {
      try {
        if (showSpinner) {
          setLoadingOrder(true);
        }
        const response = await ordersAPI.getOrder(orderId);
        setOrder(response.data.data);
        setError('');
        return response.data.data;
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load order details';
        setError(message);
        toast.error(message);
        return null;
      } finally {
        if (showSpinner) {
          setLoadingOrder(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (!order) {
      refreshOrder(true);
    }
  }, [order, refreshOrder]);

  useEffect(() => {
    if (order && !selectedMethod) {
      setSelectedMethod(order.paymentMethod);
    }
  }, [order, selectedMethod]);

  useEffect(() => {
    if (order?.shippingAddress?.phone && !telebirrPhone) {
      setTelebirrPhone(order.shippingAddress.phone);
    }
  }, [order, telebirrPhone]);

  const isProcessing = useCallback(
    (methodId) => processingMethod === methodId,
    [processingMethod]
  );

  const paymentMethods = useMemo(
    () => [
      {
        id: 'telebirr',
        name: 'TeleBirr',
        description: 'Instant mobile payment through the TeleBirr app',
        icon: '📱'
      },
      {
        id: 'chapa',
        name: 'Chapa',
        description: 'Pay securely using cards, wallets, or mobile banking',
        icon: '💳'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Transfer funds directly to our Ethiopian bank account',
        icon: '🏦'
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay the courier when your order arrives',
        icon: '💵'
      }
    ],
    []
  );

  const handleMethodChange = (methodId) => {
    setSelectedMethod(methodId);
    setTelebirrInfo(null);
    setChapaInfo(null);
    setBankSuccessMessage('');
  };

  const ensureOrderLoaded = () => {
    if (!order) {
      toast.error('Order details are still loading. Please wait a moment.');
      return false;
    }
    return true;
  };

  const navigateToSuccess = async (latestOrder) => {
    const orderData = latestOrder || order || (await refreshOrder());

    if (!orderData) {
      toast.error('Unable to open order summary. Try again shortly.');
      return;
    }

    clearCart();
    navigate(`/order/${orderData._id}/success`, {
      state: { order: orderData }
    });
  };

  const handleTelebirrPayment = async () => {
    if (!ensureOrderLoaded()) return;

    const phone = telebirrPhone || order.shippingAddress?.phone || order.customer?.phone;

    if (!phone) {
      toast.error('Please provide a TeleBirr phone number.');
      return;
    }

    setProcessingMethod('telebirr');

    try {
      const response = await paymentsAPI.initiateTeleBirr({
        orderId: order._id,
        phoneNumber: phone
      });

      setTelebirrInfo(response.data.data);
      toast.success('TeleBirr payment initiated. Complete the payment in your app.');
      await refreshOrder();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to initiate TeleBirr payment';
      toast.error(message);
    } finally {
      setProcessingMethod('');
    }
  };

  const handleChapaPayment = async () => {
    if (!ensureOrderLoaded()) return;

    setProcessingMethod('chapa');

    try {
      const response = await paymentsAPI.initiateChapa({ orderId: order._id });

      const data = response.data.data;
      setChapaInfo({
        reference: data.reference,
        message: data.message,
        checkoutUrl: data.checkoutUrl
      });

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
        toast.info('Chapa checkout opened in a new tab. Complete the payment and return to continue.');
      } else {
        toast.error('Chapa checkout URL was not provided.');
      }
      await refreshOrder();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to initiate Chapa payment';
      toast.error(message);
    } finally {
      setProcessingMethod('');
    }
  };

  const handleBankInputChange = (event) => {
    const { name, value } = event.target;
    setBankForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankSubmit = async (event) => {
    event.preventDefault();

    if (!ensureOrderLoaded()) return;

    const { bankName, accountNumber, transferDate, referenceNumber } = bankForm;

    if (!bankName || !accountNumber || !transferDate || !referenceNumber) {
      toast.error('Please complete all bank transfer details.');
      return;
    }

    setProcessingMethod('bank_transfer');

    try {
      const response = await paymentsAPI.processBankTransfer({
        orderId: order._id,
        bankName,
        accountNumber,
        transferDate,
        referenceNumber
      });

      setBankSuccessMessage(response.data.data.message);
      toast.success('Bank transfer details submitted. We will verify and update your order.');
      await refreshOrder();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit bank transfer details';
      toast.error(message);
    } finally {
      setProcessingMethod('');
    }
  };

  const handleConfirmCOD = async () => {
    if (!ensureOrderLoaded()) return;

    setProcessingMethod('cod');

    try {
      const response = await paymentsAPI.confirmCOD({ orderId: order._id });
      toast.success('Order confirmed with Cash on Delivery.');
      await refreshOrder();
      await navigateToSuccess(response.data.data.order);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to confirm COD order';
      toast.error(message);
    } finally {
      setProcessingMethod('');
    }
  };

  if (loadingOrder) {
    return <LoadingSpinner message="Preparing your payment options..." />;
  }

  if (error && !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => refreshOrder(true)}>
            Retry Loading Order
          </Button>
        </div>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  const renderMethodDetails = () => {
    switch (selectedMethod) {
      case 'telebirr':
        return (
          <Card className="mt-3">
            <Card.Body>
              <h5>TeleBirr Payment</h5>
              <p className="text-muted">
                Initiate a TeleBirr push notification to your phone and approve the payment. Once completed, return here to view your order summary.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>TeleBirr Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="e.g. +251912345678"
                  value={telebirrPhone}
                  onChange={(event) => setTelebirrPhone(event.target.value)}
                />
                <Form.Text className="text-muted">
                  You can use a different TeleBirr number than your shipping contact if needed.
                </Form.Text>
              </Form.Group>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={handleTelebirrPayment}
                  disabled={isProcessing('telebirr')}
                >
                  {isProcessing('telebirr') ? 'Starting TeleBirr payment...' : 'Pay with TeleBirr'}
                </Button>
                {telebirrInfo && (
                  <Button variant="success" onClick={() => navigateToSuccess()}>
                    View Order Summary
                  </Button>
                )}
              </div>
              {telebirrInfo && (
                <Alert variant="success" className="mt-3">
                  <h6 className="mb-2">TeleBirr Instructions</h6>
                  <p className="mb-1">Reference: <strong>{telebirrInfo.paymentId}</strong></p>
                  {telebirrInfo.deepLink && (
                    <p className="mb-1">
                      <a href={telebirrInfo.deepLink} target="_blank" rel="noopener noreferrer">
                        Open TeleBirr app to approve payment
                      </a>
                    </p>
                  )}
                  {telebirrInfo.message && <p className="mb-0">{telebirrInfo.message}</p>}
                </Alert>
              )}
            </Card.Body>
          </Card>
        );
      case 'chapa':
        return (
          <Card className="mt-3">
            <Card.Body>
              <h5>Chapa Checkout</h5>
              <p className="text-muted">
                You will be redirected to Chapa to complete your payment with cards, mobile wallets, or online banking. After completing the payment, return to this page to continue.
              </p>
              <Button
                variant="primary"
                onClick={handleChapaPayment}
                disabled={isProcessing('chapa')}
              >
                {isProcessing('chapa') ? 'Redirecting to Chapa...' : 'Continue to Chapa'}
              </Button>
              {chapaInfo && (
                <Alert variant="info" className="mt-3">
                  <h6 className="mb-2">Chapa Payment Started</h6>
                  <p className="mb-1">Reference: <strong>{chapaInfo.reference}</strong></p>
                  {chapaInfo.message && <p className="mb-1">{chapaInfo.message}</p>}
                  {chapaInfo.checkoutUrl && (
                    <p className="mb-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => window.open(chapaInfo.checkoutUrl, '_blank', 'noopener,noreferrer')}
                      >
                        Reopen Chapa Checkout
                      </Button>
                    </p>
                  )}
                  <p className="mb-0">After completing the payment, return here and view your order summary.</p>
                  <Button className="mt-3" variant="success" onClick={() => navigateToSuccess()}>
                    View Order Summary
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        );
      case 'bank_transfer':
        return (
          <Card className="mt-3">
            <Card.Body>
              <h5>Bank Transfer</h5>
              <p className="text-muted">
                Transfer the order total to our account and submit the transfer details below. We will verify and update your order status.
              </p>
              <Alert variant="info">
                <p className="mb-1"><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
                <p className="mb-1"><strong>Account Name:</strong> EthioEcommerce</p>
                <p className="mb-1"><strong>Account Number:</strong> 1000 2345 6789</p>
                <p className="mb-0"><strong>Reference:</strong> Use your order number {order.orderNumber}</p>
              </Alert>
              <Form onSubmit={handleBankSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    name="bankName"
                    value={bankForm.bankName}
                    onChange={handleBankInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Account Number Used</Form.Label>
                  <Form.Control
                    name="accountNumber"
                    value={bankForm.accountNumber}
                    onChange={handleBankInputChange}
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Transfer Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="transferDate"
                        value={bankForm.transferDate}
                        onChange={handleBankInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reference Number</Form.Label>
                      <Form.Control
                        name="referenceNumber"
                        value={bankForm.referenceNumber}
                        onChange={handleBankInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProcessing('bank_transfer')}
                >
                  {isProcessing('bank_transfer') ? 'Submitting details...' : 'Submit Transfer Details'}
                </Button>
              </Form>
              {bankSuccessMessage && (
                <Alert variant="success" className="mt-3">
                  {bankSuccessMessage}
                  <div className="mt-3">
                    <Button variant="success" onClick={() => navigateToSuccess()}>
                      View Order Summary
                    </Button>
                  </div>
                </Alert>
              )}
            </Card.Body>
          </Card>
        );
      case 'cod':
        return (
          <Card className="mt-3">
            <Card.Body>
              <h5>Cash on Delivery</h5>
              <p className="text-muted">
                Confirm that you will pay with cash when your order is delivered.
              </p>
              <Button
                variant="primary"
                onClick={handleConfirmCOD}
                disabled={isProcessing('cod')}
              >
                {isProcessing('cod') ? 'Confirming COD...' : 'Confirm Cash on Delivery'}
              </Button>
            </Card.Body>
          </Card>
        );
      default:
        return (
          <Alert variant="warning" className="mt-3">
            Select a payment method to continue.
          </Alert>
        );
    }
  };

  return (
    <Container className="py-4">
      <CheckoutSteps step1 step2 step3 />

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Choose Your Payment Method</h4>
            </Card.Header>
            <Card.Body>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`mb-3 ${selectedMethod === method.id ? 'border-primary' : ''}`}
                >
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '2rem' }}>
                      {method.icon}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{method.name}</h5>
                      <p className="mb-0 text-muted">{method.description}</p>
                    </div>
                    <Form.Check
                      type="radio"
                      name="paymentMethod"
                      checked={selectedMethod === method.id}
                      onChange={() => handleMethodChange(method.id)}
                    />
                  </Card.Body>
                </Card>
              ))}
              {renderMethodDetails()}
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => navigate('/checkout')}>
                  Back to Checkout
                </Button>
                <Button variant="outline-primary" onClick={() => navigateToSuccess()}>
                  Skip Payment for Now
                </Button>
              </div>
              <Alert variant="light" className="mt-3">
                <small className="text-muted">
                  Need help with payments? Contact our support team at <strong>+251 11 123 4567</strong> or email <strong>support@ethioecommerce.com</strong>.
                </small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Order Number</span>
                  <span className="fw-semibold">{order.orderNumber}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Status</span>
                  <Badge bg={order.paymentStatus === 'completed' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
              {order.items.map((item) => (
                <div key={item._id || item.product} className="d-flex justify-content-between mb-2">
                  <div>
                    <div className="fw-semibold small">{item.name?.en || item.name}</div>
                    <div className="text-muted small">Qty: {item.quantity}</div>
                  </div>
                  <div className="small">{formatPrice(item.subtotal)}</div>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.items.reduce((sum, item) => sum + item.subtotal, 0))}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCost || 0)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderPaymentPage;
