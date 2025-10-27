import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';
import '../../styles/sellerProfile.css';

const SellerProfilePage = () => {
  const { user } = useAuth();
  const { ethiopianRegions } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [storeData, setStoreData] = useState({
    storeName: '',
    storeDescription: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: {
      region: 'Addis Ababa',
      city: '',
      specificLocation: ''
    },
    businessHours: {
      openingTime: '09:00',
      closingTime: '18:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    socialMedia: {
      facebook: '',
      telegram: '',
      instagram: ''
    },
    storePolicies: {
      returnPolicy: '7 days return policy for defective products',
      shippingPolicy: 'Free shipping for orders above 1000 ETB in Addis Ababa',
      warrantyPolicy: '1 year warranty on electronics'
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    }
  });

  const [storeImage, setStoreImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    // In real app, fetch store profile from API
    const mockStoreData = {
      storeName: 'Tech Gadgets Ethiopia',
      storeDescription: 'Your trusted partner for quality electronics and gadgets in Ethiopia. We offer the latest smartphones, laptops, and accessories with warranty.',
      storeEmail: 'store@techgadgets.et',
      storePhone: '+251911223344',
      storeAddress: {
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        specificLocation: 'Bole Medhanialem, near Friendship City Center'
      },
      businessHours: {
        openingTime: '09:00',
        closingTime: '18:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      socialMedia: {
        facebook: 'techgadgetsethiopia',
        telegram: '+251911223344',
        instagram: 'techgadgets_et'
      },
      storePolicies: {
        returnPolicy: '7 days return policy for defective products',
        shippingPolicy: 'Free shipping for orders above 1000 ETB in Addis Ababa',
        warrantyPolicy: '1 year warranty on electronics'
      },
      bankAccount: {
        bankName: 'Commercial Bank of Ethiopia',
        accountNumber: '100023456789',
        accountHolder: 'Tech Gadgets Ethiopia'
      }
    };

    setStoreData(mockStoreData);
    setImagePreview('/images/store-placeholder.jpg');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('storeAddress.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        storeAddress: { ...prev.storeAddress, [field]: value }
      }));
    } else if (name.startsWith('businessHours.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        businessHours: { ...prev.businessHours, [field]: value }
      }));
    } else if (name.startsWith('socialMedia.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, [field]: value }
      }));
    } else if (name.startsWith('storePolicies.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        storePolicies: { ...prev.storePolicies, [field]: value }
      }));
    } else if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        bankAccount: { ...prev.bankAccount, [field]: value }
      }));
    } else {
      setStoreData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleWorkingDayChange = (day) => {
    setStoreData(prev => {
      const currentDays = [...prev.businessHours.workingDays];
      const index = currentDays.indexOf(day);
      
      if (index > -1) {
        currentDays.splice(index, 1);
      } else {
        currentDays.push(day);
      }
      
      return {
        ...prev,
        businessHours: {
          ...prev.businessHours,
          workingDays: currentDays
        }
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStoreImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      // In real app: await sellerAPI.updateSellerProfile(storeData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('Store profile updated successfully!');
    } catch (error) {
      setError('Failed to update store profile');
    } finally {
      setSaving(false);
    }
  };

  const workingDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  if (loading) return <LoadingSpinner message="Loading store profile..." />;

  return (
    <Container fluid className="seller-profile-container py-5">
      <div className="mb-4 seller-profile-header">
        <h1 className="seller-profile-title">Store Profile</h1>
        <p className="seller-profile-subtitle mb-0">Manage your store information and settings</p>
      </div>

      {message && <Alert variant="success" className="seller-profile-alert">{message}</Alert>}
      {error && <Alert variant="danger" className="seller-profile-alert">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Store Information */}
          <Col lg={8}>
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Store Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Store Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeName"
                        value={storeData.storeName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your store name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Store Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="storeEmail"
                        value={storeData.storeEmail}
                        onChange={handleInputChange}
                        required
                        placeholder="store@example.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Store Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="storeDescription"
                    value={storeData.storeDescription}
                    onChange={handleInputChange}
                    required
                    placeholder="Describe your store, products, and what makes you unique..."
                  />
                  <Form.Text className="text-muted">
                    This description will be shown to customers on your store page.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Store Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="storePhone"
                    value={storeData.storePhone}
                    onChange={handleInputChange}
                    required
                    placeholder="+251 91 123 4567"
                    pattern="^(\+251|0)[1-9]\d{8}$"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Store Address */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Store Location</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Region *</Form.Label>
                      <Form.Select
                        name="storeAddress.region"
                        value={storeData.storeAddress.region}
                        onChange={handleInputChange}
                        required
                      >
                        {ethiopianRegions.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.city"
                        value={storeData.storeAddress.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter city"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Specific Location *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="storeAddress.specificLocation"
                    value={storeData.storeAddress.specificLocation}
                    onChange={handleInputChange}
                    required
                    placeholder="Detailed location with landmarks"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Business Hours */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Business Hours</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Opening Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="businessHours.openingTime"
                        value={storeData.businessHours.openingTime}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Closing Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="businessHours.closingTime"
                        value={storeData.businessHours.closingTime}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Working Days</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {workingDays.map(day => (
                      <Form.Check
                        key={day.value}
                        type="checkbox"
                        id={`day-${day.value}`}
                        label={day.label}
                        checked={storeData.businessHours.workingDays.includes(day.value)}
                        onChange={() => handleWorkingDayChange(day.value)}
                        inline
                      />
                    ))}
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Store Policies */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Store Policies</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Return Policy</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="storePolicies.returnPolicy"
                    value={storeData.storePolicies.returnPolicy}
                    onChange={handleInputChange}
                    placeholder="Describe your return policy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Shipping Policy</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="storePolicies.shippingPolicy"
                    value={storeData.storePolicies.shippingPolicy}
                    onChange={handleInputChange}
                    placeholder="Describe your shipping policy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Warranty Policy</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="storePolicies.warrantyPolicy"
                    value={storeData.storePolicies.warrantyPolicy}
                    onChange={handleInputChange}
                    placeholder="Describe your warranty policy"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Store Image */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Store Image</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="mb-3">
                  <Image
                    src={imagePreview}
                    alt="Store preview"
                    fluid
                    rounded
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
                <Form.Group>
                  <Form.Label>Upload Store Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Recommended: 400x400px, JPG or PNG
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Social Media */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header className="seller-profile-card-header">
                <h5 className="mb-0">Social Media</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Facebook</Form.Label>
                  <Form.Control
                    type="text"
                    name="socialMedia.facebook"
                    value={storeData.socialMedia.facebook}
                    onChange={handleInputChange}
                    placeholder="Username or page URL"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Telegram</Form.Label>
                  <Form.Control
                    type="text"
                    name="socialMedia.telegram"
                    value={storeData.socialMedia.telegram}
                    onChange={handleInputChange}
                    placeholder="Phone number or username"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control
                    type="text"
                    name="socialMedia.instagram"
                    value={storeData.socialMedia.instagram}
                    onChange={handleInputChange}
                    placeholder="Username"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Bank Account */}
            <Card className="mb-4 seller-profile-card">
              <Card.Header>
                <h5 className="mb-0">Bank Account</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount.bankName"
                    value={storeData.bankAccount.bankName}
                    onChange={handleInputChange}
                    placeholder="Commercial Bank of Ethiopia"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Account Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount.accountNumber"
                    value={storeData.bankAccount.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Account number"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Account Holder</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount.accountHolder"
                    value={storeData.bankAccount.accountHolder}
                    onChange={handleInputChange}
                    placeholder="Account holder name"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Store Statistics */}
            <Card className="bg-light seller-profile-card seller-profile-stats-card">
              <Card.Body>
                <h6 className="mb-3">Store Statistics</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Products:</span>
                  <strong>12</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Orders:</span>
                  <strong>34</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Store Rating:</span>
                  <strong>4.5/5</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Store Since:</span>
                  <strong>Jan 2024</strong>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Submit Button */}
        <Card className="seller-profile-card seller-profile-submit-card">
          <Card.Body className="text-center">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Store Profile'}
            </Button>
            <div className="mt-2">
              <small className="text-muted">
                Your store profile will be visible to customers on your store page.
              </small>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </Container>
  );
};

export default SellerProfilePage;