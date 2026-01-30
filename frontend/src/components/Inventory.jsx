import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/api';

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;
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
    <div className="p-3 md:p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} in inventory
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium self-start sm:self-center"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="bg-gray-50 rounded-xl p-4 md:p-5 mb-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingProduct}
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="e.g., SKU001"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price (₹) *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading products...</p>
          </div>
        ) : (
          /* Products Table/Cards */
          <div className="mt-4">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cost Price</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Selling Price</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center">
                        <div className="text-gray-400 mb-2">📦</div>
                        <p className="text-gray-500">No products found</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first product above</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{product.sku}</td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            product.quantity > 10
                              ? 'bg-green-100 text-green-800'
                              : product.quantity > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-700">₹{product.costPrice.toFixed(2)}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-blue-700">₹{product.sellingPrice.toFixed(2)}</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.quantity > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product._id)}
                              className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {products.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-gray-400 text-3xl mb-3">📦</div>
                  <p className="text-gray-500">No products in inventory</p>
                  <p className="text-sm text-gray-400 mt-1">Tap "Add New Product" to get started</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{product.sku}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.quantity > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.quantity > 0 ? 'In Stock' : 'Out'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Quantity</div>
                        <div className="font-medium text-lg">{product.quantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Selling Price</div>
                        <div className="font-semibold text-blue-700 text-lg">₹{product.sellingPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cost Price</div>
                        <div className="font-medium text-gray-700">₹{product.costPrice.toFixed(2)}</div>
                      </div>
                      <div className="flex items-end">
                        <div className="text-xs text-gray-500">
                          Profit: ₹{(product.sellingPrice - product.costPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {!loading && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium">Total Products</div>
              <div className="text-xl font-semibold text-blue-700">{products.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 font-medium">In Stock</div>
              <div className="text-xl font-semibold text-green-700">
                {products.filter(p => p.quantity > 0).length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-medium">Out of Stock</div>
              <div className="text-xl font-semibold text-purple-700">
                {products.filter(p => p.quantity === 0).length}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-xs text-amber-600 font-medium">Low Stock (≤10)</div>
              <div className="text-xl font-semibold text-amber-700">
                {products.filter(p => p.quantity > 0 && p.quantity <= 10).length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;