import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const ReviewList = ({ productId, reviews = [] }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { t } = useApp();

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      // In real app: await reviewsAPI.createReview(productId, reviewData);
      console.log('Submitting review:', reviewData);
      // Reset form
      setReviewData({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
      alert('Review submitted successfully!');
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, editable = false }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${editable ? 'editable' : ''}`}
            onClick={() => editable && onRatingChange(star)}
            style={{ 
              cursor: editable ? 'pointer' : 'default',
              color: star <= rating ? '#ffc107' : '#e4e5e9',
              fontSize: '1.2rem',
              marginRight: '2px'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingStats = () => {
    const stats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    reviews.forEach(review => {
      stats[review.rating]++;
    });

    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0;

    return { stats, total, average };
  };

  const { stats, total, average } = getRatingStats();

  return (
    <div className="reviews-section">
      <h4 className="mb-4">Customer Reviews</h4>

      {/* Rating Overview */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-4 fw-bold text-primary">{average.toFixed(1)}</div>
              <StarRating rating={Math.round(average)} />
              <div className="text-muted mt-2">{total} reviews</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Body>
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="d-flex align-items-center mb-2">
                  <div className="me-2" style={{ width: '60px' }}>
                    <small>{rating} ★</small>
                  </div>
                  <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-warning" 
                      style={{ width: `${total > 0 ? (stats[rating] / total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <small className="text-muted" style={{ width: '40px' }}>
                    {stats[rating]}
                  </small>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Review Button */}
      {isAuthenticated && !showReviewForm && (
        <div className="text-center mb-4">
          <Button 
            variant="outline-primary" 
            onClick={() => setShowReviewForm(true)}
          >
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Write a Review</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmitReview}>
              <Form.Group className="mb-3">
                <Form.Label>Your Rating</Form.Label>
                <div>
                  <StarRating 
                    rating={reviewData.rating} 
                    onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                    editable={true}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Review Title</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Your Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share details of your experience with this product..."
                  required
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline-secondary"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="reviews-list">
          {reviews.map(review => (
            <Card key={review._id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">{review.title}</h6>
                    <StarRating rating={review.rating} />
                  </div>
                  <small className="text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </small>
                </div>
                
                <p className="mb-2">{review.comment}</p>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{review.user?.name}</strong>
                    {review.verified && (
                      <Badge bg="success" className="ms-2">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <div>
                    <small className="text-muted">
                      Was this helpful? 
                      <Button variant="link" size="sm">Yes</Button>
                      <Button variant="link" size="sm">No</Button>
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <Alert variant="info" className="text-center">
          <h5>No reviews yet</h5>
          <p className="mb-0">Be the first to review this product!</p>
        </Alert>
      )}
    </div>
  );
};

export default ReviewList;