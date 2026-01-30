import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api/api';
import './Reports.css';

function Reports() {
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const loadReport = React.useCallback(async () => {
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="reports">
      <div className="card">
        <div className="card-header">Reports & Analytics</div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Period Selector */}
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'daily' ? 'active' : ''}`}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </button>
          <button
            className={`period-btn ${period === 'all-time' ? 'active' : ''}`}
            onClick={() => setPeriod('all-time')}
          >
            All-Time
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading report...</div>
        ) : reportData ? (
          <div className="report-content">
            {/* Date Range */}
            <div className="report-header">
              <h3>
                {period.charAt(0).toUpperCase() + period.slice(1)} Report
              </h3>
              {period !== 'all-time' && (
                <p className="date-range">
                  {formatDate(reportData.dateRange.start)} - {formatDate(reportData.dateRange.end)}
                </p>
              )}
            </div>

            {/* Sales Report */}
            <div className="report-section">
              <h4 className="section-title">Sales Report</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Bills Generated</div>
                  <div className="metric-value">{reportData.sales.totalBills}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Sales</div>
                  <div className="metric-value revenue">{formatCurrency(reportData.sales.grossRevenue)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Cost of Goods Sold</div>
                  <div className="metric-value">{formatCurrency(reportData.sales.totalCostOfGoodsSold || 0)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Discounts Given</div>
                  <div className="metric-value">{formatCurrency(reportData.sales.totalDiscounts)}</div>
                </div>
                <div className="metric-card" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
                  <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Profit</div>
                  <div className="metric-value" style={{ color: 'white', fontSize: '32px' }}>
                    {formatCurrency(reportData.sales.totalProfit || 0)}
                  </div>
                </div>
              </div>

              {/* Bills by Payment Type */}
              {reportData.sales.billsByPaymentType && (
                <div style={{ marginTop: '30px' }}>
                  <h5 style={{ marginBottom: '15px', color: '#333' }}>Bills by Payment Type</h5>
                  <div className="payment-type-grid">
                    {/* UPI Column */}
                    <div className="payment-column">
                      <div className="payment-column-header" style={{ background: '#007bff', color: 'white' }}>
                        <h5>UPI</h5>
                        <div className="payment-total">{formatCurrency(reportData.sales.paymentTotals?.UPI || 0)}</div>
                      </div>
                      <div className="payment-bills-list">
                        {reportData.sales.billsByPaymentType.UPI && reportData.sales.billsByPaymentType.UPI.length > 0 ? (
                          <table className="payment-table">
                            <thead>
                              <tr>
                                <th>Bill No</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.sales.billsByPaymentType.UPI.map((bill, idx) => (
                                <tr key={idx}>
                                  <td>{bill.billNumber}</td>
                                  <td>{formatCurrency(bill.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="no-bills">No UPI bills</div>
                        )}
                      </div>
                    </div>

                    {/* Cash Column */}
                    <div className="payment-column">
                      <div className="payment-column-header" style={{ background: '#28a745', color: 'white' }}>
                        <h5>Cash</h5>
                        <div className="payment-total">{formatCurrency(reportData.sales.paymentTotals?.Cash || 0)}</div>
                      </div>
                      <div className="payment-bills-list">
                        {reportData.sales.billsByPaymentType.Cash && reportData.sales.billsByPaymentType.Cash.length > 0 ? (
                          <table className="payment-table">
                            <thead>
                              <tr>
                                <th>Bill No</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.sales.billsByPaymentType.Cash.map((bill, idx) => (
                                <tr key={idx}>
                                  <td>{bill.billNumber}</td>
                                  <td>{formatCurrency(bill.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="no-bills">No Cash bills</div>
                        )}
                      </div>
                    </div>

                    {/* Pending Column */}
                    <div className="payment-column">
                      <div className="payment-column-header" style={{ background: '#ffc107', color: '#333' }}>
                        <h5>Pending</h5>
                        <div className="payment-total">{formatCurrency(reportData.sales.paymentTotals?.Pending || 0)}</div>
                      </div>
                      <div className="payment-bills-list">
                        {reportData.sales.billsByPaymentType.Pending && reportData.sales.billsByPaymentType.Pending.length > 0 ? (
                          <table className="payment-table">
                            <thead>
                              <tr>
                                <th>Bill No</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.sales.billsByPaymentType.Pending.map((bill, idx) => (
                                <tr key={idx}>
                                  <td>{bill.billNumber}</td>
                                  <td>{formatCurrency(bill.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="no-bills">No Pending bills</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grand Total */}
                  {reportData.sales.grandTotal !== undefined && (
                    <div className="grand-total-row" style={{
                      marginTop: '20px',
                      padding: '15px',
                      background: '#e9ecef',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      <span>Grand Total: </span>
                      <span style={{ color: '#007bff', fontSize: '20px' }}>
                        {formatCurrency(reportData.sales.grandTotal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inventory Report */}
            <div className="report-section">
              <h4 className="section-title">Inventory Report</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Items Sold</div>
                  <div className="metric-value">{reportData.inventory.totalItemsSold}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Items Remaining in Stock</div>
                  <div className="metric-value">{reportData.inventory.itemsRemaining}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Inventory Value (at Cost)</div>
                  <div className="metric-value">{formatCurrency(reportData.inventory.totalInventoryValue)}</div>
                </div>
              </div>

              {/* Item-wise Sales Breakdown */}
              {reportData.inventory.itemsSoldBreakdown && reportData.inventory.itemsSoldBreakdown.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h5 style={{ marginBottom: '15px', color: '#333' }}>Item-wise Sales Breakdown</h5>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ background: 'white' }}>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>SKU</th>
                          <th>Quantity Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.inventory.itemsSoldBreakdown.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.productName}</td>
                            <td>{item.sku}</td>
                            <td style={{ fontWeight: '600', color: '#007bff' }}>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Cash Report */}
            <div className="report-section">
              <h4 className="section-title">Cash in Hand</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Sales</div>
                  <div className="metric-value">{formatCurrency(reportData.cash.totalSales)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Discounts</div>
                  <div className="metric-value">{formatCurrency(reportData.cash.totalDiscounts)}</div>
                </div>
                <div className="metric-card cash-card">
                  <div className="metric-label">Cash in Hand</div>
                  <div className="metric-value cash-value">{formatCurrency(reportData.cash.cashInHand)}</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="report-summary">
              <h4 className="section-title">Summary</h4>
              <div className="summary-content">
                <p>
                  <strong>Period:</strong> {period.charAt(0).toUpperCase() + period.slice(1)}
                </p>
                <p>
                  <strong>Bills Generated:</strong> {reportData.sales.totalBills}
                </p>
                <p>
                  <strong>Total Sales:</strong> {formatCurrency(reportData.sales.grossRevenue)}
                </p>
                <p>
                  <strong>Total Cost of Goods Sold:</strong> {formatCurrency(reportData.sales.totalCostOfGoodsSold || 0)}
                </p>
                <p>
                  <strong>Total Discounts:</strong> {formatCurrency(reportData.sales.totalDiscounts)}
                </p>
                <p>
                  <strong>Total Profit:</strong> <span style={{ color: '#28a745', fontWeight: '600', fontSize: '18px' }}>
                    {formatCurrency(reportData.sales.totalProfit || 0)}
                  </span>
                </p>
                <p>
                  <strong>Items Sold:</strong> {reportData.inventory.totalItemsSold}
                </p>
                <p>
                  <strong>Cash Available:</strong> {formatCurrency(reportData.cash.cashInHand)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
