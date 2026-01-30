import React, { useState, useEffect } from 'react';
import { billsAPI, productsAPI } from '../api/api';

function Billing() {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [, setSavedBillId] = useState(null);

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
    loadAvailableProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBill]);

  const loadAvailableProducts = async () => {
    try {
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

  const getAvailableStock = (productId) => {
    const product = availableProducts.find(p => p._id === productId);
    if (!product) return 0;

    if (editingBill) {
      const itemInBill = formData.items.find(item => item.productId === productId);
      if (itemInBill) {
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

    const existingItemIndex = formData.items.findIndex(
      item => item.productId === product._id
    );

    if (existingItemIndex >= 0) {
      const currentQty = formData.items[existingItemIndex].quantity;
      if (currentQty < availableStock) {
        handleItemChange(existingItemIndex, 'quantity', currentQty + 1);
      } else {
        setError(`Maximum available stock for ${product.name} is ${availableStock}`);
      }
    } else {
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
        const maxAllowed = availableStock;

        if (qty > maxAllowed) {
          setError(`Maximum available stock is ${maxAllowed} for ${item.productName}`);
          return prev;
        }

        if (qty <= 0) {
          setError('Quantity must be greater than 0');
          return prev;
        }

        item[field] = qty;
        setError('');
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

      await loadAvailableProducts();
      await loadBills();

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

      try {
        const whatsappResponse = await billsAPI.getWhatsAppLink(billId);
        if (whatsappResponse?.data?.whatsappLink) {
          setWhatsappLink(whatsappResponse.data.whatsappLink);
          setSavedBillId(billId);
          setShowWhatsAppModal(true);
        } else {
          setError('Bill saved but failed to generate WhatsApp link');
        }
      } catch (err) {
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
    await loadAvailableProducts();
  };

  const filteredProducts = availableProducts.filter(
    (product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(itemSearch.toLowerCase());

      const hasStock = getAvailableStock(product._id) > 0;
      const isInBill = editingBill && formData.items.some(item => item.productId === product._id);

      return matchesSearch && (hasStock || isInBill);
    }
  );

  const { subtotal, totalDiscount, grandTotal } = calculateTotals();

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-4 max-w-7xl mx-auto">
      {/* Create/Edit Bill Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {editingBill ? `Edit Bill: ${editingBill.billNumber}` : 'Create New Bill'}
          </h1>
          {editingBill && (
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm md:text-base rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 border-b pb-2">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  required
                  className="w-full p-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  required
                  className="w-full p-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 border-b pb-2">
                Items ({formData.items.length})
              </h2>
              <div className="relative flex-1 max-w-xs">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  {showItemDropdown && itemSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-gray-500 text-sm">No products found</div>
                      ) : (
                        filteredProducts.map((product) => {
                          const availableStock = getAvailableStock(product._id);
                          const isOutOfStock = availableStock === 0;
                          const isInBill = formData.items.some(item => item.productId === product._id);

                          return (
                            <button
                              key={product._id}
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => !isOutOfStock && handleAddItem(product)}
                              className={`w-full text-left p-3 border-b border-gray-100 last:border-0 transition ${
                                isOutOfStock
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className="font-medium truncate">
                                {product.name}
                                {isInBill && <span className="text-blue-600 ml-1.5 text-xs">(In bill)</span>}
                              </div>
                              <div className="flex justify-between items-center mt-1 text-sm">
                                <span className="text-gray-600">{product.sku}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">₹{product.sellingPrice}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    availableStock > 10
                                      ? 'bg-green-100 text-green-800'
                                      : availableStock > 0
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    Stock: {availableStock}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table - Responsive */}
            {formData.items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="text-gray-500 mb-2">No items added yet</div>
                <p className="text-sm text-gray-400">Search and add products above</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-full">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Discount</th>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subtotal</th>
                          <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{item.sku}</div>
                              {item.comment && (
                                <div className="text-xs text-blue-600 mt-0.5">Note: {item.comment}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                max={getAvailableStock(item.productId)}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="w-16 p-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                              <div className="text-xs text-gray-500 mt-0.5">
                                Max: {getAvailableStock(item.productId)}
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.sellingPrice}
                                onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                                className="w-20 p-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                className="w-20 p-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 font-medium">
                              ₹{((item.quantity * item.sellingPrice) - (item.discount || 0)).toFixed(2)}
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3 p-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-500">{item.sku}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-500">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={getAvailableStock(item.productId)}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Discount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500">Subtotal</label>
                            <div className="font-medium mt-2">
                              ₹{((item.quantity * item.sellingPrice) - (item.discount || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        {item.comment && (
                          <div className="text-xs text-blue-600 mt-2">
                            <span className="font-medium">Note:</span> {item.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className="bg-gray-50 rounded-xl p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Type *</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, paymentType: e.target.value }))
                  }
                  required
                  className="w-full p-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Global Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.globalDiscount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, globalDiscount: e.target.value }))
                  }
                  className="w-full p-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-700">Total Discount:</span>
                <span className="font-medium text-red-600">₹{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 mt-2 pt-3 border-t border-gray-300">
                <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                <span className="text-xl font-bold text-blue-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                {editingBill ? 'Update Bill' : 'Save Bill'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bill Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-5">Search Bills</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by Bill Number or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-5 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
          >
            Search
          </button>
        </div>

        {showSearchResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Results ({searchResults.length})
              </h3>
              {searchResults.length > 0 && (
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Hide results
                </button>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bills found matching your search
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-full">
                  {/* Desktop Table */}
                  <table className="hidden md:table w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Bill No</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchResults.map((bill) => (
                        <tr key={bill._id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{bill.billNumber}</td>
                          <td className="p-3">{bill.customerName}</td>
                          <td className="p-3">{bill.customerPhone}</td>
                          <td className="p-3 font-semibold">₹{bill.grandTotal.toFixed(2)}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditBill(bill)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWhatsApp(bill._id)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                              >
                                WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBill(bill)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                                title="Delete and return items to inventory"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3 p-3">
                    {searchResults.map((bill) => (
                      <div key={bill._id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">#{bill.billNumber}</div>
                            <div className="text-sm text-gray-600 mt-1">{bill.customerName}</div>
                            <div className="text-sm text-gray-500">{bill.customerPhone}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-700">₹{bill.grandTotal.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => handleEditBill(bill)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWhatsApp(bill._id)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBill(bill)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Bill Saved Successfully!</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-gray-600 mb-4">
                Share this bill with your customer via WhatsApp:
              </p>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">WhatsApp Link:</div>
                <div className="text-sm break-all font-medium">{whatsappLink}</div>
              </div>
            </div>
            
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition"
              >
                Copy Link
              </button>
              <button
                onClick={handleOpenWhatsApp}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
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