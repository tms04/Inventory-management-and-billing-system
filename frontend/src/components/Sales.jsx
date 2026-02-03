import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../api/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Sales() {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = viewMode === 'day'
        ? { type: 'day', date }
        : { type: 'month', year, month };
      const response = await reportsAPI.getSalesDetail(params);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sales');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode, date, year, month]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const formatDateRange = () => {
    if (!data?.dateRange) return '';
    const start = new Date(data.dateRange.start);
    const end = new Date(data.dateRange.end);
    if (viewMode === 'day') {
      return start.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
  };

  const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
          Sales by Date
        </h1>
        <p className="text-gray-500 text-sm mb-4">
          View all items sold on a specific day or for an entire month
        </p>

        {/* View mode toggle */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Date / Month selectors */}
        <div className="flex flex-wrap items-end gap-4">
          {viewMode === 'day' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-500 mt-2">Loading sales...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm">
              <div className="text-xs md:text-sm text-gray-500 font-medium">Period</div>
              <div className="text-sm md:text-base font-semibold text-gray-900 mt-0.5 truncate" title={formatDateRange()}>
                {formatDateRange()}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm">
              <div className="text-xs md:text-sm text-gray-500 font-medium">Bills</div>
              <div className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5">{data.totalBills}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm">
              <div className="text-xs md:text-sm text-gray-500 font-medium">Items sold</div>
              <div className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5">{data.totalQuantity}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm">
              <div className="text-xs md:text-sm text-gray-500 font-medium">Revenue</div>
              <div className="text-lg md:text-xl font-semibold text-green-600 mt-0.5">{formatCurrency(data.grossRevenue)}</div>
            </div>
          </div>

          {/* Items sold */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 p-4 border-b border-gray-100">
              Items sold
            </h2>

            {!data.itemsSoldBreakdown?.length ? (
              <div className="p-8 text-center text-gray-500">
                No sales recorded for this {viewMode === 'day' ? 'day' : 'month'}.
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.itemsSoldBreakdown.map((item, idx) => (
                        <tr key={`${item.sku}-${idx}`} className="hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                          <td className="p-3 text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="p-3 text-sm text-gray-600">{item.sku}</td>
                          <td className="p-3 text-sm font-semibold text-gray-900 text-right">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {data.itemsSoldBreakdown.map((item, idx) => (
                    <div
                      key={`${item.sku}-${idx}`}
                      className="p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{item.productName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.sku}</div>
                      </div>
                      <div className="flex-shrink-0 w-12 text-right font-semibold text-gray-900">
                        {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default Sales;
