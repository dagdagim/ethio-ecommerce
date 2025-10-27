import React from 'react';
import { Spinner } from 'react-bootstrap';
import '../../styles/loadingSpinner.css';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-card text-center">
        <div className="loading-spinner-ring">
          <Spinner animation="border" role="status" variant="light" className="loading-spinner-icon">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
        <p className="loading-spinner-message mb-2">{message}</p>
        <small className="loading-spinner-subtext">Please hold on while we prepare something great for you.</small>
      </div>
    </div>
  );
};

export default LoadingSpinner;