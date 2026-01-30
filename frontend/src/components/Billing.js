import React, { useState, useEffect } from 'react';
import { billsAPI, productsAPI } from '../api/api';
import './Billing.css';

function Billing() {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [savedBillId, setSavedBillId] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    items: [],
    globalDiscount: 0,
    paymentType: 'Cash',
  });

  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    // Reload products when switching between edit and create mode
    loadAvailableProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBill]);

  const loadAvailableProducts = async () => {
    try {
      // When editing, get all products to show items already in bill
      // Otherwise, get only available products
      if (editingBill) {
        const response = await productsAPI.getAll();
        setAvailableProducts(response.data);
      } else {
        const response = await productsAPI.getAvailable();
        setAvailableProducts(response.data);
      }
    } catch (err) {
      setError('Failed to load products');
    }
  };

  // Get available stock for a product considering items already in the bill
  const getAvailableStock = (productId) => {
    const product = availableProducts.find(p => p._id === productId);
    if (!product) return 0;
    
    // If editing a bill, add back quantities already in the bill
    if (editingBill) {
      const itemInBill = formData.items.find(item => item.productId === productId);
      if (itemInBill) {
        // Get current stock and add back what's already allocated in this bill
        return product.quantity + itemInBill.quantity;
      }
    }
    
    return product.quantity;
  };

  const loadBills = async () => {
    try {
      const response = await billsAPI.getAll();
      setBills(response.data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await billsAPI.search(searchQuery);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (err) {
      setError('Failed to search bills');
    }
  };

  const handleAddItem = (product) => {
    const availableStock = getAvailableStock(product._id);
    
    if (availableStock === 0) {
      setError('This item is out of stock!');
      return;
    }

    // Check if item already exists in the bill
    const existingItemIndex = formData.items.findIndex(
      item => item.productId === product._id
    );

    if (existingItemIndex >= 0) {
      // If item exists, increase quantity by 1 if stock allows
      const currentQty = formData.items[existingItemIndex].quantity;
      if (currentQty < availableStock) {
        handleItemChange(existingItemIndex, 'quantity', currentQty + 1);
      } else {
        setError(`Maximum available stock for ${product.name} is ${availableStock}`);
      }
    } else {
      // Add new item
      const newItem = {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        sellingPrice: product.sellingPrice,
        discount: 0,
        comment: '',
      };

      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }

    setItemSearch('');
    setShowItemDropdown(false);
    setError('');
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      
      if (field === 'quantity') {
        const qty = parseFloat(value) || 0;
        const availableStock = getAvailableStock(item.productId);
        
        // When editing, we need to consider what's already in the bill
        let maxAllowed = availableStock;
        if (editingBill) {
          // Available stock already includes what's in the bill
          maxAllowed = availableStock;
        }
        
        if (qty > maxAllowed) {
          setError(`Maximum available stock is ${maxAllowed} for ${item.productName}`);
          return prev;
        }
        
        if (qty <= 0) {
          setError('Quantity must be greater than 0');
          return prev;
        }
        
        item[field] = qty;
        setError(''); // Clear error on valid input
      } else if (field === 'sellingPrice' || field === 'discount') {
        const numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          setError(`${field} cannot be negative`);
          return prev;
        }
        item[field] = numValue;
        setError('');
      } else {
        item[field] = value;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    formData.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.sellingPrice;
      subtotal += itemSubtotal;
      totalDiscount += item.discount || 0;
    });

    const globalDiscount = parseFloat(formData.globalDiscount) || 0;
    totalDiscount += globalDiscount;
    const grandTotal = subtotal - totalDiscount;

    return { subtotal, totalDiscount, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (formData.items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      const billData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        items: formData.items,
        globalDiscount: parseFloat(formData.globalDiscount) || 0,
        paymentType: formData.paymentType || 'Cash',
      };

      let billId;
      if (editingBill) {
        const updateResponse = await billsAPI.update(editingBill._id, billData);
        billId = updateResponse.data._id;
        setSuccess('Bill updated successfully!');
      } else {
        const createResponse = await billsAPI.create(billData);
        billId = createResponse.data._id;
        setSuccess('Bill created successfully!');
      }

      // Reload stock after bill operations
      await loadAvailableProducts();
      await loadBills();

      // Reset form fields (but don't close modal yet)
      setFormData({
        customerName: '',
        customerPhone: '',
        items: [],
        globalDiscount: 0,
        paymentType: 'Cash',
      });
      setEditingBill(null);
      setError('');
      setSuccess('');

      // Get WhatsApp link and show modal
      try {
        const whatsappResponse = await billsAPI.getWhatsAppLink(billId);
        console.log('WhatsApp response:', whatsappResponse);
        if (whatsappResponse && whatsappResponse.data && whatsappResponse.data.whatsappLink) {
          setWhatsappLink(whatsappResponse.data.whatsappLink);
          setSavedBillId(billId);
          setShowWhatsAppModal(true);
          console.log('Modal state set to true, whatsappLink:', whatsappResponse.data.whatsappLink);
        } else {
          console.error('No WhatsApp link in response:', whatsappResponse);
          setError('Bill saved but failed to generate WhatsApp link');
        }
      } catch (err) {
        console.error('Failed to get WhatsApp link - full error:', err);
        console.error('Error response:', err.response);
        setError('Bill saved but failed to generate WhatsApp link. You can generate it later from the search results.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save bill');
    }
  };

  const handleEditBill = async (bill) => {
    try {
      setError('');
      setSuccess('');
      
      // Reload products to get latest stock levels
      await loadAvailableProducts();
      
      const response = await billsAPI.getById(bill._id);
      const billData = response.data;
      
      setEditingBill(billData);
      setFormData({
        customerName: billData.customerName,
        customerPhone: billData.customerPhone,
        items: billData.items.map(item => ({
          productId: item.productId._id || item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          discount: item.discount,
          comment: item.comment || '',
        })),
        globalDiscount: billData.globalDiscount,
        paymentType: billData.paymentType || 'Cash',
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to load bill for editing');
    }
  };

  const handleWhatsApp = async (billId) => {
    try {
      const response = await billsAPI.getWhatsAppLink(billId);
      window.open(response.data.whatsappLink, '_blank');
    } catch (err) {
      setError('Failed to generate WhatsApp link');
    }
  };

  const handleDeleteBill = async (bill) => {
    try {
      setError('');
      const confirmed = window.confirm(
        `Delete bill ${bill.billNumber}?\n\n` +
        `This will:\n` +
        `- Remove the bill from records\n` +
        `- Return all items to inventory\n` +
        `- No profit will be recorded for this sale\n\n` +
        `This action cannot be undone.`
      );
      
      if (confirmed) {
        await billsAPI.delete(bill._id);
        setSuccess(`Bill ${bill.billNumber} deleted successfully! Items have been returned to inventory.`);
        
        await loadAvailableProducts();
        await loadBills();
        
        // Clear search results if the deleted bill was in them
        if (showSearchResults) {
          setSearchResults(searchResults.filter(b => b._id !== bill._id));
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete bill');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappLink).then(() => {
      setSuccess('WhatsApp link copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => {
      setError('Failed to copy link');
    });
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappLink, '_blank');
  };

  const handleCloseModal = () => {
    setShowWhatsAppModal(false);
    setWhatsappLink('');
    setSavedBillId(null);
  };

  const resetForm = async () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      items: [],
      globalDiscount: 0,
      paymentType: 'Cash',
    });
    setEditingBill(null);
    setError('');
    setSuccess('');
    setShowWhatsAppModal(false);
    setWhatsappLink('');
    setSavedBillId(null);
    // Reload available products when resetting (switches back to available-only mode)
    await loadAvailableProducts();
  };

  const filteredProducts = availableProducts.filter(
    (product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(itemSearch.toLowerCase());
      
      // Only show products with stock > 0, or products already in the bill when editing
      const hasStock = getAvailableStock(product._id) > 0;
      const isInBill = editingBill && formData.items.some(item => item.productId === product._id);
      
      return matchesSearch && (hasStock || isInBill);
    }
  );

  const { subtotal, totalDiscount, grandTotal } = calculateTotals();

  return (
    <div className="billing">
      <div className="card">
        <div className="card-header">
          {editingBill ? `Edit Bill: ${editingBill.billNumber}` : 'Create New Bill'}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="billing-form">
          {/* Customer Details */}
          <div className="customer-section">
            <h3>Customer Details</h3>
            <div className="form-row">
              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>Customer Phone *</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="items-section">
            <h3>Items</h3>
            
            {/* Item Search Dropdown */}
            <div className="item-search-container">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setShowItemDropdown(true);
                }}
                onFocus={() => setShowItemDropdown(true)}
                className="item-search-input"
              />
              {showItemDropdown && itemSearch && (
                <div className="item-dropdown">
                  {filteredProducts.length === 0 ? (
                    <div className="dropdown-item">No products found</div>
                  ) : (
                    filteredProducts.map((product) => {
                      const availableStock = getAvailableStock(product._id);
                      const isOutOfStock = availableStock === 0;
                      const isInBill = formData.items.some(item => item.productId === product._id);
                      
                      return (
                        <div
                          key={product._id}
                          className={`dropdown-item ${isOutOfStock ? 'out-of-stock' : ''}`}
                          onClick={() => !isOutOfStock && handleAddItem(product)}
                          style={{
                            opacity: isOutOfStock ? 0.5 : 1,
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <div>
                            <strong>{product.name}</strong> ({product.sku})
                            {isInBill && <span style={{ color: '#007bff', marginLeft: '8px' }}>(Already in bill)</span>}
                          </div>
                          <div>
                            ₹{product.sellingPrice.toFixed(2)} | 
                            <span style={{ 
                              color: availableStock > 10 ? '#28a745' : availableStock > 0 ? '#ffc107' : '#dc3545',
                              fontWeight: '600',
                              marginLeft: '5px'
                            }}>
                              Stock: {availableStock}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="table items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Comment</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>
                      No items added. Search and add products above.
                    </td>
                  </tr>
                ) : (
                  formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={getAvailableStock(item.productId)}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                          className="qty-input"
                          title={`Max available: ${getAvailableStock(item.productId)}`}
                        />
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          Max: {getAvailableStock(item.productId)}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.sellingPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'sellingPrice', e.target.value)
                          }
                          className="price-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, 'discount', e.target.value)
                          }
                          className="discount-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.comment}
                          onChange={(e) =>
                            handleItemChange(index, 'comment', e.target.value)
                          }
                          placeholder="Optional"
                          className="comment-input"
                        />
                      </td>
                      <td>
                        ₹{((item.quantity * item.sellingPrice) - (item.discount || 0)).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleRemoveItem(index)}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="totals-row">
              <div className="input-group">
                <label>Payment Type *</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, paymentType: e.target.value }))
                  }
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="input-group">
                <label>Global Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.globalDiscount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, globalDiscount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="totals-summary">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Total Discount:</span>
                <span>₹{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingBill ? 'Update Bill' : 'Save Bill'}
            </button>
            {editingBill && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bill Search */}
      <div className="card">
        <div className="card-header">Search Bills</div>
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by Bill Number or Phone Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Search
          </button>
        </div>

        {showSearchResults && (
          <div className="search-results">
            <h4>Search Results ({searchResults.length})</h4>
            {searchResults.length === 0 ? (
              <p>No bills found</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((bill) => (
                    <tr key={bill._id}>
                      <td>{bill.billNumber}</td>
                      <td>{bill.customerName}</td>
                      <td>{bill.customerPhone}</td>
                      <td>₹{bill.grandTotal.toFixed(2)}</td>
                      <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleEditBill(bill)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleDeleteBill(bill)}
                          title="Delete Bill - Returns items to inventory, removes from records"
                        >
                          Delete
                        </button>
                        <button
                          className="btn btn-success"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleWhatsApp(bill._id)}
                        >
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bill Saved Successfully!</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Share this bill with your customer via WhatsApp:</p>
              <div className="whatsapp-link-container">
                <input
                  type="text"
                  value={whatsappLink}
                  readOnly
                  className="whatsapp-link-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCopyLink}>
                Copy Link
              </button>
              <button className="btn btn-success" onClick={handleOpenWhatsApp}>
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
