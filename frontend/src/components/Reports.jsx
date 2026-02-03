import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../api/api';

function Reports() {
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportsAPI.getComprehensive(period);
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

  return (
    <div className="p-3 md:p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">
              Comprehensive insights into your business performance
            </p>
            <Link
              to="/sales"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View Sales by Date →
            </Link>
          </div>
          
          {/* Period Selector */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {['daily', 'monthly', 'all-time'].map((p) => (
              <button
                key={p}
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading report data...</p>
          </div>
        ) : reportData ? (
          <div className="space-y-5">
            {/* Report Header */}
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {period.charAt(0).toUpperCase() + period.slice(1)} Report
              </h2>
              {period !== 'all-time' && (
                <p className="text-gray-500 text-sm mt-1">
                  {formatDate(reportData.dateRange?.start)} - {formatDate(reportData.dateRange?.end)}
                </p>
              )}
            </div>

            {/* Sales Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Total Bills</div>
                <div className="text-2xl font-semibold text-gray-900">{reportData.sales?.totalBills || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Total Sales</div>
                <div className="text-2xl font-semibold text-green-600">
                  {formatCurrency(reportData.sales?.grossRevenue)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Total Discounts</div>
                <div className="text-2xl font-semibold text-amber-600">
                  {formatCurrency(reportData.sales?.totalDiscounts)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4">
                <div className="text-xs font-medium opacity-90 mb-1">Total Profit</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.sales?.totalProfit || 0)}
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            {reportData.sales?.billsByPaymentType && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { type: 'UPI', color: 'bg-blue-100 text-blue-800', bills: reportData.sales.billsByPaymentType.UPI || [], total: reportData.sales.paymentTotals?.UPI || 0 },
                    { type: 'Cash', color: 'bg-green-100 text-green-800', bills: reportData.sales.billsByPaymentType.Cash || [], total: reportData.sales.paymentTotals?.Cash || 0 },
                    { type: 'Pending', color: 'bg-amber-100 text-amber-800', bills: reportData.sales.billsByPaymentType.Pending || [], total: reportData.sales.paymentTotals?.Pending || 0 }
                  ].map((payment) => (
                    <div key={payment.type} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className={`${payment.color} p-3 md:p-4`}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">{payment.type}</h4>
                          <div className="text-lg font-bold">{formatCurrency(payment.total)}</div>
                        </div>
                      </div>
                      
                      {/* Payment List - Mobile */}
                      <div className="md:hidden">
                        {payment.bills.length > 0 ? (
                          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {payment.bills.slice(0, 3).map((bill, idx) => (
                              <div key={idx} className="p-3">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">#{bill.billNumber}</div>
                                  <div className="font-semibold">{formatCurrency(bill.amount)}</div>
                                </div>
                              </div>
                            ))}
                            {payment.bills.length > 3 && (
                              <div className="p-3 text-center text-gray-500 text-sm">
                                + {payment.bills.length - 3} more bills
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-400 italic">No {payment.type} bills</div>
                        )}
                      </div>
                      
                      {/* Payment List - Desktop */}
                      <div className="hidden md:block">
                        {payment.bills.length > 0 ? (
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left p-3 font-medium text-gray-700">Bill No</th>
                                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payment.bills.map((bill, idx) => (
                                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="p-3">#{bill.billNumber}</td>
                                    <td className="p-3 font-medium">{formatCurrency(bill.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-400 italic">No {payment.type} bills</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column - Inventory Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 font-medium mb-1">Items Sold</div>
                    <div className="text-xl font-semibold text-blue-700">
                      {reportData.inventory?.totalItemsSold || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium mb-1">In Stock</div>
                    <div className="text-xl font-semibold text-green-700">
                      {reportData.inventory?.itemsRemaining || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 font-medium mb-1">Inventory Value</div>
                    <div className="text-xl font-semibold text-purple-700">
                      {formatCurrency(reportData.inventory?.totalInventoryValue)}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-xs text-amber-600 font-medium mb-1">COGS</div>
                    <div className="text-xl font-semibold text-amber-700">
                      {formatCurrency(reportData.sales?.totalCostOfGoodsSold || 0)}
                    </div>
                  </div>
                </div>

                {/* Top Selling Items */}
                {reportData.inventory?.itemsSoldBreakdown?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Selling Items</h4>
                    <div className="space-y-2">
                      {reportData.inventory.itemsSoldBreakdown.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{item.productName}</div>
                            <div className="text-xs text-gray-500">{item.sku}</div>
                          </div>
                          <div className="text-sm font-semibold text-blue-600 whitespace-nowrap ml-2">
                            {item.quantity} sold
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Cash & Summary */}
              <div className="space-y-5">
                {/* Cash Report */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Cash Report</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Sales</span>
                      <span className="font-semibold">{formatCurrency(reportData.cash?.totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Discounts</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(reportData.cash?.totalDiscounts)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-gray-700 font-medium">Cash in Hand</span>
                      <span className="text-xl font-bold text-blue-700">{formatCurrency(reportData.cash?.cashInHand)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-500">Bills Generated</div>
                      <div className="text-sm font-medium text-right">{reportData.sales?.totalBills || 0}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-500">Total Sales</div>
                      <div className="text-sm font-medium text-right text-green-600">
                        {formatCurrency(reportData.sales?.grossRevenue)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-500">Total Profit</div>
                      <div className="text-sm font-medium text-right text-blue-600">
                        {formatCurrency(reportData.sales?.totalProfit || 0)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-500">Items Sold</div>
                      <div className="text-sm font-medium text-right">{reportData.inventory?.totalItemsSold || 0}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm text-gray-500">Cash Available</div>
                      <div className="text-sm font-medium text-right">
                        {formatCurrency(reportData.cash?.cashInHand)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Items Sales - Desktop */}
            {reportData.inventory?.itemsSoldBreakdown?.length > 0 && (
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-5 mt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Item Sales</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase">Product Name</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase">SKU</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase">Quantity Sold</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.inventory.itemsSoldBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                          </td>
                          <td className="p-3 text-gray-600">{item.sku}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-green-600">
                            {formatCurrency(item.totalRevenue || item.quantity * (item.sellingPrice || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📊</div>
            <p className="text-gray-500">No report data available</p>
            <p className="text-sm text-gray-400 mt-1">Try selecting a different period</p>
          </div>
        )}
      </div>

      {/* Export/Print Button */}
      {reportData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Export Report</h3>
              <p className="text-xs text-gray-500">Download or print this report</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => alert('Export functionality would be implemented here')}
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;