import React from 'react';
import { Container } from 'react-bootstrap';
import ProductList from '../components/products/ProductList';
import '../styles/ProductsPage.css';

const ProductsPage = () => {
  return (
    <Container className="py-5 products-page">
      <div className="text-center mb-5 products-page-header">
        <h1 className="products-page-title">Our Products</h1>
        <p className="lead products-page-subtitle">Discover amazing products from across Ethiopia</p>
      </div>
      <ProductList />
    </Container>
  );
};

export default ProductsPage;