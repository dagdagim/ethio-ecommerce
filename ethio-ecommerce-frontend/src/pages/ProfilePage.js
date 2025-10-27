import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Message from '../components/common/Message';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { ethiopianRegions } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      region: 'Addis Ababa',
      city: '',
      subcity: '',
      woreda: '',
      kebele: '',
      houseNumber: '',
      specificLocation: ''
    }
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          region: user.address?.region || 'Addis Ababa',
          city: user.address?.city || '',
          subcity: user.address?.subcity || '',
          woreda: user.address?.woreda || '',
          kebele: user.address?.kebele || '',
          houseNumber: user.address?.houseNumber || '',
          specificLocation: user.address?.specificLocation || ''
        }
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setMessage('Profile updated successfully!');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h1 className="mb-4">My Profile</h1>
          
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            {/* Profile Information Tab */}
            <Tab eventKey="profile" title="Profile Information">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Personal Information</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleProfileSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        required
                        pattern="^(\+251|0)[1-9]\d{8}$"
                      />
                      <Form.Text className="text-muted">
                        Format: +251XXXXXXXXX or 09XXXXXXXX
                      </Form.Text>
                    </Form.Group>

                    <hr className="my-4" />
                    
                    <h5 className="mb-3">Address Information</h5>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Region *</Form.Label>
                          <Form.Select
                            name="address.region"
                            value={profileData.address.region}
                            onChange={handleProfileChange}
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
                            name="address.city"
                            value={profileData.address.city}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Subcity</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.subcity"
                            value={profileData.address.subcity}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Woreda</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.woreda"
                            value={profileData.address.woreda}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kebele</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.kebele"
                            value={profileData.address.kebele}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>House Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.houseNumber"
                            value={profileData.address.houseNumber}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Specific Location *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address.specificLocation"
                        value={profileData.address.specificLocation}
                        onChange={handleProfileChange}
                        required
                        placeholder="Detailed location description with landmarks"
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Change Password Tab */}
            <Tab eventKey="password" title="Change Password">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Change Password</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handlePasswordSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 6 characters long
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Confirm New Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Account Information Tab */}
            <Tab eventKey="account" title="Account Information">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Account Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <table className="table table-striped">
                        <tbody>
                          <tr>
                            <td><strong>Account Type</strong></td>
                            <td>
                              <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'seller' ? 'warning' : 'primary'}`}>
                                {user.role?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Member Since</strong></td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td><strong>Email Verified</strong></td>
                            <td>
                              {user.isVerified ? (
                                <span className="badge bg-success">Verified</span>
                              ) : (
                                <span className="badge bg-warning">Pending</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                    <Col md={6}>
                      <div className="text-center">
                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                             style={{ width: '100px', height: '100px' }}>
                          <i className="fas fa-user fa-3x text-muted"></i>
                        </div>
                        <h5>{user.name}</h5>
                        <p className="text-muted">{user.email}</p>
                        <p className="text-muted">{user.phone}</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;