import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import '../../styles/admin.css';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';


const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchUsers = async () => {
    try {
      // Fetch users from backend admin endpoint
      const res = await adminAPI.getUsers();
      let fetched = res.data.data || res.data || [];

      if (!Array.isArray(fetched) && fetched.users) {
        fetched = fetched.users;
      }

      let filteredUsers = fetched;
      if (filter !== 'all') {
        filteredUsers = fetched.filter(user => user.role === filter);
      }

      setUsers(filteredUsers);

      // Calculate stats
      const stats = {
        total: fetched.length,
        customers: fetched.filter(u => u.role === 'customer').length,
        sellers: fetched.filter(u => u.role === 'seller').length,
        admins: fetched.filter(u => u.role === 'admin').length,
        verified: fetched.filter(u => u.isVerified).length
      };
      setUserStats(stats || {});

    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleVariant = (role) => {
    const variants = {
      admin: 'danger',
      seller: 'warning',
      customer: 'primary'
    };
    return variants[role] || 'secondary';
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Failed to update user role', error);
      alert(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleVerificationToggle = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { isVerified: !currentStatus });
      setUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, isVerified: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Failed to update verification status', error);
      alert(error.response?.data?.message || 'Failed to update verification status');
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <Container fluid className="admin-users-page">
      <div className="users-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">User Management</h1>
          <p className="text-muted mb-0">Manage platform users and permissions</p>
        </div>
        <Form.Select 
          className="users-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* User Stats */}
      <Row className="mb-4 users-stats-row">
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-primary stat-value">{userStats.total || 0}</h3><small className="text-muted">Total Users</small></Card.Body></Card></Col>
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-success stat-value">{userStats.customers || 0}</h3><small className="text-muted">Customers</small></Card.Body></Card></Col>
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-warning stat-value">{userStats.sellers || 0}</h3><small className="text-muted">Sellers</small></Card.Body></Card></Col>
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-danger stat-value">{userStats.admins || 0}</h3><small className="text-muted">Admins</small></Card.Body></Card></Col>
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-info stat-value">{userStats.verified || 0}</h3><small className="text-muted">Verified</small></Card.Body></Card></Col>
        <Col xl={2} md={4} sm={6}><Card className="glass-card users-stat"><Card.Body className="text-center"><h3 className="text-secondary stat-value">{userStats.total - userStats.verified || 0}</h3><small className="text-muted">Unverified</small></Card.Body></Card></Col>
      </Row>

      <Card className="glass-card users-list-card">
        <Card.Header className="users-list-header">
          <h5 className="mb-0">
            <i className="fas fa-users me-2 text-primary"></i>
            Users ({users.length})
            {filter !== 'all' && <span className="text-muted"> - {filter}s</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 users-table">
            <thead className="bg-light">
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="user-row">
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="user-avatar glass-avatar me-3">
                        <i className="fas fa-user"></i>
                      </div>
                      <div>
                        <div className="fw-semibold user-name">{user.name}</div>
                        <small className="text-muted">ID: {user._id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{user.email}</div>
                      <small className="text-muted">{user.phone}</small>
                    </div>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      className="user-role-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </td>
                  <td>
                    <div className="d-flex gap-1 align-items-center">
                      <Badge bg={user.isVerified ? 'success' : 'warning'}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="verify-btn"
                        onClick={() => handleVerificationToggle(user._id, user.isVerified)}
                      >
                        {user.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
                    </div>
                  </td>
                  <td>
                    <Badge bg="info" className="orders-badge">{user.orders}</Badge>
                  </td>
                  <td>
                    <small>{formatDate(user.createdAt)}</small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="view-btn"
                        onClick={() => handleViewDetails(user)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="delete-btn"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            // Handle delete
                            alert('User deletion would be implemented here');
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {users.length === 0 && (
            <div className="empty-users-state text-center py-5">
              <div className="empty-users-illustration mb-3">👥</div>
              <h5>No users found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No users registered yet.' : `No ${filter} users found.`}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* User Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" dialogClassName="user-details-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-user-circle fa-lg text-primary"></i>
              <span>User Details</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="user-details-modal-body">
          {selectedUser && (
            <Row>
              <Col md={6}>
                <Card className="glass-card user-details-card">
                  <Card.Header>
                    <h6 className="mb-0">Basic Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-striped">
                      <tbody>
                        <tr>
                          <td><strong>Name</strong></td>
                          <td>{selectedUser.name}</td>
                        </tr>
                        <tr>
                          <td><strong>Email</strong></td>
                          <td>{selectedUser.email}</td>
                        </tr>
                        <tr>
                          <td><strong>Phone</strong></td>
                          <td>{selectedUser.phone}</td>
                        </tr>
                        <tr>
                          <td><strong>Role</strong></td>
                          <td>
                            <Badge bg={getRoleVariant(selectedUser.role)}>
                              {selectedUser.role}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Status</strong></td>
                          <td>
                            <Badge bg={selectedUser.isVerified ? 'success' : 'warning'}>
                              {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Joined</strong></td>
                          <td>{formatDate(selectedUser.createdAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="glass-card user-details-card">
                  <Card.Header>
                    <h6 className="mb-0">Activity Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-4">
                      <div className="display-4 text-primary mb-2">{selectedUser.orders}</div>
                      <div className="text-muted">Total Orders</div>
                    </div>
                    <div className="d-grid gap-2 mt-3">
                      <Button variant="outline-primary" className="user-modal-btn">View Order History</Button>
                      <Button variant="outline-secondary" className="user-modal-btn">Send Message</Button>
                      <Button variant="outline-info" className="user-modal-btn">Login as User</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsersPage;