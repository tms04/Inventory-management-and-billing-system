const express = require('express');
const router = express.Router();
const CreditNote = require('../models/CreditNote');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

// Generate next credit note number
async function getNextCreditNoteNumber() {
  const settings = await Settings.getSettings();
  settings.lastCreditNoteNumber += 1;
  await settings.save();
  return `CN-${String(settings.lastCreditNoteNumber).padStart(3, '0')}`;
}

// Update inventory (add back stock for credit notes)
async function updateInventoryForCreditNote(items) {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productName} not found`);
    }
    product.quantity += item.quantity;
    await product.save();
  }
}

// Create credit note
router.post('/', async (req, res) => {
  try {
    const { originalBillId, items, reason } = req.body;

    // Get original bill
    const originalBill = await Bill.findById(originalBillId);
    if (!originalBill) {
      return res.status(404).json({ error: 'Original bill not found' });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    let totalAmount = 0;
    let totalProfitLoss = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productName} not found` });
      }

      // Verify item exists in original bill
      const originalItem = originalBill.items.find(
        i => i.productId.toString() === item.productId
      );
      if (!originalItem) {
        return res.status(400).json({ 
          error: `Item ${item.productName} not found in original bill` 
        });
      }

      if (item.quantity > originalItem.quantity) {
        return res.status(400).json({ 
          error: `Credit quantity (${item.quantity}) cannot exceed original quantity (${originalItem.quantity})` 
        });
      }

      const itemAmount = item.quantity * item.sellingPrice;
      const itemCost = item.quantity * product.costPrice;
      const itemProfitLoss = itemAmount - itemCost; // Profit that was lost due to return
      
      totalAmount += itemAmount;
      totalProfitLoss += itemProfitLoss;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: product.costPrice,
        reason: item.reason || ''
      });
    }

    // Generate credit note number
    const creditNoteNumber = await getNextCreditNoteNumber();

    // Create credit note
    const creditNote = new CreditNote({
      creditNoteNumber,
      originalBillNumber: originalBill.billNumber,
      originalBillId: originalBill._id,
      customerName: originalBill.customerName,
      customerPhone: originalBill.customerPhone,
      items: processedItems,
      totalAmount,
      totalProfitLoss,
      reason: reason || ''
    });

    await creditNote.save();

    // Update inventory (add back stock)
    await updateInventoryForCreditNote(processedItems);

    res.status(201).json(creditNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all credit notes
router.get('/', async (req, res) => {
  try {
    const creditNotes = await CreditNote.find()
      .populate('originalBillId', 'billNumber')
      .sort({ createdAt: -1 });
    res.json(creditNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get credit note by ID
router.get('/:id', async (req, res) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id)
      .populate('originalBillId', 'billNumber');
    if (!creditNote) {
      return res.status(404).json({ error: 'Credit note not found' });
    }
    res.json(creditNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get credit notes by bill ID
router.get('/bill/:billId', async (req, res) => {
  try {
    const creditNotes = await CreditNote.find({ originalBillId: req.params.billId })
      .sort({ createdAt: -1 });
    res.json(creditNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
