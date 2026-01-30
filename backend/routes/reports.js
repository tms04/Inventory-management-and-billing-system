const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const CreditNote = require('../models/CreditNote');

// Helper function to get date range
function getDateRange(period) {
  const now = new Date();
  let start, end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'all-time':
      start = new Date(0); // Beginning of time
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  return { start, end };
}

// Get sales report
router.get('/sales/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { start, end } = getDateRange(period);

    const bills = await Bill.find({
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });

    const totalBills = bills.length;
    const totalDiscounts = bills.reduce((sum, bill) => sum + bill.totalDiscount, 0);
    const grossRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);

    // Segregate bills by payment type
    const billsByPaymentType = {
      UPI: [],
      Cash: [],
      Pending: []
    };

    bills.forEach(bill => {
      const billData = {
        billNumber: bill.billNumber,
        amount: bill.grandTotal,
        customerName: bill.customerName,
        date: bill.createdAt
      };
      const paymentType = bill.paymentType || 'Cash';
      if (billsByPaymentType[paymentType]) {
        billsByPaymentType[paymentType].push(billData);
      }
    });

    // Calculate totals for each payment type
    const totals = {
      UPI: billsByPaymentType.UPI.reduce((sum, bill) => sum + bill.amount, 0),
      Cash: billsByPaymentType.Cash.reduce((sum, bill) => sum + bill.amount, 0),
      Pending: billsByPaymentType.Pending.reduce((sum, bill) => sum + bill.amount, 0)
    };

    const grandTotal = totals.UPI + totals.Cash + totals.Pending;

    res.json({
      period,
      dateRange: { start, end },
      totalBills,
      totalDiscounts,
      grossRevenue,
      totalCreditNoteAmount,
      totalCreditNoteProfitLoss,
      netRevenue,
      billsByPaymentType,
      totals,
      grandTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory report
router.get('/inventory/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { start, end } = getDateRange(period);

    // Get all bills in the period
    const bills = await Bill.find({
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate items sold with details
    const itemsSoldMap = new Map();
    const itemsSoldDetails = new Map();
    
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const key = item.productId.toString();
        const currentQty = itemsSoldMap.get(key) || 0;
        itemsSoldMap.set(key, currentQty + item.quantity);
        
        // Store product details
        if (!itemsSoldDetails.has(key)) {
          itemsSoldDetails.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: 0
          });
        }
        const detail = itemsSoldDetails.get(key);
        detail.quantity += item.quantity;
      });
    });

    // Get current inventory
    const products = await Product.find();
    const totalItemsSold = Array.from(itemsSoldMap.values()).reduce((sum, qty) => sum + qty, 0);
    const itemsRemaining = products.reduce((sum, product) => sum + product.quantity, 0);
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + (product.quantity * (product.costPrice || 0)),
      0
    );

    // Convert to array sorted by quantity
    const itemsSoldBreakdown = Array.from(itemsSoldDetails.values()).sort((a, b) => b.quantity - a.quantity);

    res.json({
      period,
      dateRange: { start, end },
      totalItemsSold,
      itemsRemaining,
      totalInventoryValue,
      itemsSoldBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cash in hand report
router.get('/cash/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { start, end } = getDateRange(period);

    const bills = await Bill.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalSales = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalDiscounts = bills.reduce((sum, bill) => sum + bill.totalDiscount, 0);
    const cashInHand = totalSales; // Total sales minus discounts already accounted in grandTotal

    res.json({
      period,
      dateRange: { start, end },
      totalSales,
      totalDiscounts,
      cashInHand
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive report (all metrics)
router.get('/comprehensive/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { start, end } = getDateRange(period);

    // Get bills
    const bills = await Bill.find({
      createdAt: { $gte: start, $lte: end }
    });

    // Get credit notes in the period
    const creditNotes = await CreditNote.find({
      createdAt: { $gte: start, $lte: end }
    });

    // Sales metrics
    const totalBills = bills.length;
    const totalDiscounts = bills.reduce((sum, bill) => sum + bill.totalDiscount, 0);
    const grossRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    
    // Credit note deductions
    const totalCreditNoteAmount = creditNotes.reduce((sum, cn) => sum + cn.totalAmount, 0);
    const totalCreditNoteProfitLoss = creditNotes.reduce((sum, cn) => sum + (cn.totalProfitLoss || 0), 0);
    const netRevenue = grossRevenue - totalCreditNoteAmount;

    // Segregate bills by payment type for comprehensive report
    const billsByPaymentType = {
      UPI: [],
      Cash: [],
      Pending: []
    };

    bills.forEach(bill => {
      const billData = {
        billNumber: bill.billNumber,
        amount: bill.grandTotal,
        customerName: bill.customerName,
        date: bill.createdAt
      };
      const paymentType = bill.paymentType || 'Cash';
      if (billsByPaymentType[paymentType]) {
        billsByPaymentType[paymentType].push(billData);
      }
    });

    const paymentTotals = {
      UPI: billsByPaymentType.UPI.reduce((sum, bill) => sum + bill.amount, 0),
      Cash: billsByPaymentType.Cash.reduce((sum, bill) => sum + bill.amount, 0),
      Pending: billsByPaymentType.Pending.reduce((sum, bill) => sum + bill.amount, 0)
    };

    // Inventory metrics - item-wise sales breakdown
    const itemsSoldMap = new Map();
    const itemsSoldDetails = new Map(); // Store product details with quantities
    let totalCostOfGoodsSold = 0; // Track total cost of products sold
    
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const key = item.productId.toString();
        const currentQty = itemsSoldMap.get(key) || 0;
        itemsSoldMap.set(key, currentQty + item.quantity);
        
        // Store product details
        if (!itemsSoldDetails.has(key)) {
          itemsSoldDetails.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: 0,
            costPrice: 0
          });
        }
        const detail = itemsSoldDetails.get(key);
        detail.quantity += item.quantity;
        
        // Get product cost price for profit calculation
        // We need to fetch product to get cost price
      });
    });

    // Fetch products to get cost prices
    const products = await Product.find();
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Calculate total cost of goods sold and update item details
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const product = productMap.get(item.productId.toString());
        if (product) {
          const itemCost = item.quantity * product.costPrice;
          totalCostOfGoodsSold += itemCost;
          
          // Update item details with cost price
          const key = item.productId.toString();
          if (itemsSoldDetails.has(key)) {
            const detail = itemsSoldDetails.get(key);
            detail.costPrice = product.costPrice;
          }
        }
      });
    });

    const totalItemsSold = Array.from(itemsSoldMap.values()).reduce((sum, qty) => sum + qty, 0);
    const itemsRemaining = products.reduce((sum, product) => sum + product.quantity, 0);
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + (product.quantity * product.costPrice),
      0
    );
    
    // Convert itemsSoldDetails to array for frontend
    const itemsSoldBreakdown = Array.from(itemsSoldDetails.values()).sort((a, b) => b.quantity - a.quantity);
    
    // Calculate total profit: Total Sales - Cost of Goods Sold - Discounts
    const totalProfit = grossRevenue - totalCostOfGoodsSold - totalDiscounts;

    // Cash metrics (adjusted for credit notes)
    const cashInHand = grossRevenue - totalCreditNoteAmount;

    res.json({
      period,
      dateRange: { start, end },
      sales: {
        totalBills,
        totalDiscounts,
        grossRevenue,
        totalCostOfGoodsSold,
        totalProfit,
        totalCreditNoteAmount,
        totalCreditNoteProfitLoss,
        netRevenue,
        billsByPaymentType,
        paymentTotals,
        grandTotal: paymentTotals.UPI + paymentTotals.Cash + paymentTotals.Pending
      },
      inventory: {
        totalItemsSold,
        itemsRemaining,
        totalInventoryValue,
        itemsSoldBreakdown
      },
      cash: {
        totalSales: grossRevenue,
        totalDiscounts,
        totalCreditNoteAmount,
        cashInHand
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
