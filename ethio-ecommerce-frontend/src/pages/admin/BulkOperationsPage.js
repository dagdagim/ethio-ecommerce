import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, ProgressBar } from 'react-bootstrap';
import { productsAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import Message from '../../components/common/Message';

const BulkOperationsPage = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [importFile, setImportFile] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [bulkUpdate, setBulkUpdate] = useState({
    field: 'price',
    operation: 'set',
    value: '',
    condition: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { language } = useApp();

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      // Simulate import process
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // In real app: await productsAPI.bulkImport(formData);
      setMessage('Products imported successfully!');
      setImportFile(null);
    } catch (error) {
      setError('Failed to import products');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getProducts({ limit: 1000 });
      setExportData(response.data.data);
      
      // Create CSV content
      const headers = ['SKU', 'Name (EN)', 'Name (AM)', 'Price', 'Stock', 'Category', 'Status'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(product => [
          product.sku,
          `"${product.name.en}"`,
          `"${product.name.am}"`,
          product.price,
          product.stock,
          product.category?.name?.[language] || product.category?.name?.en,
          product.status
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      setMessage('Products exported successfully!');
    } catch (error) {
      setError('Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In real app: await productsAPI.bulkUpdate(bulkUpdate);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage('Bulk update completed successfully!');
      setBulkUpdate({
        field: 'price',
        operation: 'set',
        value: '',
        condition: 'all'
      });
    } catch (error) {
      setError('Failed to perform bulk update');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['SKU', 'Name (EN)', 'Name (AM)', 'Description (EN)', 'Description (AM)', 'Price', 'Stock', 'Category', 'Brand', 'Status'],
      ['PROD-001', 'Product One', 'ምርት አንድ', 'English description', 'አማርኛ መግለጫ', '1000', '50', 'Electronics', 'BrandA', 'active'],
      ['PROD-002', 'Product Two', 'ምርት ሁለት', 'English description', 'አማርኛ መግለጫ', '2000', '25', 'Clothing', 'BrandB', 'active']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1>Bulk Operations</h1>
        <p className="text-muted mb-0">Manage products in bulk with import/export and batch updates</p>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tabs */}
      <Card>
        <Card.Header>
          <div className="d-flex border-bottom">
            <Button
              variant="link"
              className={`flex-fill text-decoration-none ${activeTab === 'import' ? 'border-primary border-bottom-2 text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('import')}
            >
              <i className="fas fa-upload me-2"></i>
              Import Products
            </Button>
            <Button
              variant="link"
              className={`flex-fill text-decoration-none ${activeTab === 'export' ? 'border-primary border-bottom-2 text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('export')}
            >
              <i className="fas fa-download me-2"></i>
              Export Products
            </Button>
            <Button
              variant="link"
              className={`flex-fill text-decoration-none ${activeTab === 'update' ? 'border-primary border-bottom-2 text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('update')}
            >
              <i className="fas fa-edit me-2"></i>
              Bulk Update
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Import Tab */}
          {activeTab === 'import' && (
            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Import Products</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleImport}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select CSV File</Form.Label>
                        <Form.Control
                          type="file"
                          accept=".csv"
                          onChange={(e) => setImportFile(e.target.files[0])}
                          required
                        />
                        <Form.Text className="text-muted">
                          Upload a CSV file with product data. Maximum file size: 10MB
                        </Form.Text>
                      </Form.Group>

                      <div className="d-flex gap-2 mb-3">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading || !importFile}
                        >
                          {loading ? 'Importing...' : 'Import Products'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline-secondary"
                          onClick={downloadTemplate}
                        >
                          Download Template
                        </Button>
                      </div>

                      {loading && (
                        <div className="mt-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Importing products...</small>
                            <small>{progress}%</small>
                          </div>
                          <ProgressBar now={progress} animated />
                        </div>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Import Guidelines</h6>
                  </Card.Header>
                  <Card.Body>
                    <h6>Required Fields:</h6>
                    <ul className="small">
                      <li>SKU (Unique identifier)</li>
                      <li>Name (EN) - English name</li>
                      <li>Name (AM) - Amharic name</li>
                      <li>Price (Number)</li>
                      <li>Stock (Number)</li>
                      <li>Category (Existing category name)</li>
                    </ul>

                    <h6>Optional Fields:</h6>
                    <ul className="small">
                      <li>Description (EN)</li>
                      <li>Description (AM)</li>
                      <li>Brand</li>
                      <li>Status (active/inactive)</li>
                    </ul>

                    <h6>Tips:</h6>
                    <ul className="small">
                      <li>Use the template for correct formatting</li>
                      <li>Ensure SKUs are unique</li>
                      <li>Categories must exist in the system</li>
                      <li>Prices should be numbers without currency symbols</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Export Products</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-4">
                      <p>Export your product catalog to CSV format for backup, analysis, or migration.</p>
                      <Button
                        variant="primary"
                        onClick={handleExport}
                        disabled={loading}
                      >
                        {loading ? 'Exporting...' : 'Export All Products'}
                      </Button>
                    </div>

                    {exportData.length > 0 && (
                      <div>
                        <h6>Export Preview (First 5 products)</h6>
                        <Table striped bordered size="sm">
                          <thead>
                            <tr>
                              <th>SKU</th>
                              <th>Name</th>
                              <th>Price</th>
                              <th>Stock</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exportData.slice(0, 5).map(product => (
                              <tr key={product._id}>
                                <td>{product.sku}</td>
                                <td>{product.name[language] || product.name.en}</td>
                                <td>{product.price}</td>
                                <td>{product.stock}</td>
                                <td>{product.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Export Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <h6>Included Fields:</h6>
                    <ul className="small">
                      <li>Product SKU</li>
                      <li>Name (English & Amharic)</li>
                      <li>Description (English & Amharic)</li>
                      <li>Price and Currency</li>
                      <li>Stock Quantity</li>
                      <li>Category Information</li>
                      <li>Brand</li>
                      <li>Status</li>
                      <li>Creation Date</li>
                      <li>Update Date</li>
                    </ul>

                    <h6>File Format:</h6>
                    <ul className="small">
                      <li>Format: CSV (Comma Separated Values)</li>
                      <li>Encoding: UTF-8</li>
                      <li>Delimiter: Comma (,)</li>
                      <li>Text qualifier: Double quotes (")</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Bulk Update Tab */}
          {activeTab === 'update' && (
            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Bulk Update Products</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleBulkUpdate}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Update Field</Form.Label>
                            <Form.Select
                              value={bulkUpdate.field}
                              onChange={(e) => setBulkUpdate(prev => ({ ...prev, field: e.target.value }))}
                            >
                              <option value="price">Price</option>
                              <option value="stock">Stock</option>
                              <option value="status">Status</option>
                              <option value="category">Category</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Operation</Form.Label>
                            <Form.Select
                              value={bulkUpdate.operation}
                              onChange={(e) => setBulkUpdate(prev => ({ ...prev, operation: e.target.value }))}
                            >
                              <option value="set">Set to value</option>
                              <option value="increase">Increase by</option>
                              <option value="decrease">Decrease by</option>
                              <option value="multiply">Multiply by</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Value</Form.Label>
                        <Form.Control
                          type={bulkUpdate.field === 'status' ? 'text' : 'number'}
                          value={bulkUpdate.value}
                          onChange={(e) => setBulkUpdate(prev => ({ ...prev, value: e.target.value }))}
                          placeholder={
                            bulkUpdate.field === 'status' ? 'active/inactive' :
                            bulkUpdate.field === 'price' ? 'Enter price' :
                            'Enter value'
                          }
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>Apply To</Form.Label>
                        <Form.Select
                          value={bulkUpdate.condition}
                          onChange={(e) => setBulkUpdate(prev => ({ ...prev, condition: e.target.value }))}
                        >
                          <option value="all">All Products</option>
                          <option value="in_stock">In Stock Products</option>
                          <option value="out_of_stock">Out of Stock Products</option>
                          <option value="low_stock">Low Stock Products (&lt; 10)</option>
                          <option value="active">Active Products</option>
                          <option value="inactive">Inactive Products</option>
                        </Form.Select>
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !bulkUpdate.value}
                      >
                        {loading ? 'Updating...' : 'Apply Bulk Update'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Update Preview</h6>
                  </Card.Header>
                  <Card.Body>
                    <h6>Operation Summary:</h6>
                    <div className="small">
                      <p><strong>Field:</strong> {bulkUpdate.field}</p>
                      <p><strong>Operation:</strong> {bulkUpdate.operation}</p>
                      <p><strong>Value:</strong> {bulkUpdate.value}</p>
                      <p><strong>Condition:</strong> {bulkUpdate.condition}</p>
                    </div>

                    <h6 className="mt-3">Examples:</h6>
                    <ul className="small">
                      <li><strong>Set prices:</strong> Set all prices to 1000 ETB</li>
                      <li><strong>Increase stock:</strong> Increase all stock by 10 units</li>
                      <li><strong>Update status:</strong> Set all products to active</li>
                      <li><strong>Price adjustment:</strong> Increase prices by 10%</li>
                    </ul>

                    <Alert variant="warning" className="mt-3 small">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Bulk updates cannot be undone. Please test with a small set first.
                    </Alert>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BulkOperationsPage;