import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/api';
import './Inventory.css';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    quantity: '',
    costPrice: '',
    sellingPrice: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const productData = {
        sku: formData.sku,
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        setSuccess('Product added successfully!');
      }

      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      quantity: product.quantity,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsAPI.delete(id);
      setSuccess('Product deleted successfully!');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      quantity: '',
      costPrice: '',
      sellingPrice: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div className="inventory">
      <div className="card">
        <div className="card-header">Inventory Management</div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="input-group">
                <label>SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingProduct}
                />
              </div>
              <div className="input-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="input-group">
                <label>Cost Price (₹) *</label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="input-group">
                <label>Selling Price (₹) *</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>₹{product.costPrice.toFixed(2)}</td>
                    <td>₹{product.sellingPrice.toFixed(2)}</td>
                    <td>
                      <span
                        className={`stock-badge ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'
                          }`}
                      >
                        {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;
