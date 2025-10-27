import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Pagination } from 'react-bootstrap';
import { productsAPI } from '../../services/api';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Message from '../common/Message';
import '../../styles/productList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    region: '',
    sort: 'createdAt'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await productsAPI.getProducts(params);
      setProducts(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      setError('Failed to load products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;

  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="product-list-wrapper">
      {/* Filters */}
      <div className="bg-light p-3 mb-4 rounded product-filters-panel">
        <Form onSubmit={handleSearch}>
          <Row className="gy-3 align-items-center">
            <Col md={3}>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="createdAt">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name.en">Name: A-Z</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Button type="submit" variant="primary" className="w-100 product-filter-button">
                Apply Filters
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Message variant="info">No products found matching your criteria.</Message>
      ) : (
        <>
          <Row className="product-grid g-4">
            {products.map(product => (
              <Col key={product._id} xs={6} md={4} lg={3} className="mb-4 product-grid-item">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4 product-pagination">
              <Pagination className="product-pagination-list">
                <Pagination.Prev 
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                />
                
                {[...Array(pagination.pages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === pagination.page}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;