const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

// Generate next bill number
async function getNextBillNumber() {
  const settings = await Settings.getSettings();
  settings.lastBillNumber += 1;
  await settings.save();
  return `RG-${String(settings.lastBillNumber).padStart(3, '0')}`;
}

// Update inventory based on bill items
async function updateInventory(items, isAddition = true) {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productName} not found`);
    }

    const quantityChange = isAddition ? item.quantity : -item.quantity;
    const newQuantity = product.quantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
    }

    product.quantity = newQuantity;
    await product.save();
  }
}

// Create new bill
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, items, globalDiscount, paymentType } = req.body;

    // Validation
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer details and at least one item are required' });
    }

    // Validate stock availability and calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productName} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }

      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemDiscount = item.discount || 0;
      const itemTotal = itemSubtotal - itemDiscount;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: itemDiscount,
        comment: item.comment || '',
        subtotal: itemTotal
      });
    }

    const finalGlobalDiscount = globalDiscount || 0;
    totalDiscount += finalGlobalDiscount;
    const grandTotal = subtotal - totalDiscount;

    if (grandTotal < 0) {
      return res.status(400).json({ error: 'Grand total cannot be negative' });
    }

    // Generate bill number
    const billNumber = await getNextBillNumber();

    // Create bill
    const bill = new Bill({
      billNumber,
      customerName,
      customerPhone,
      items: processedItems,
      subtotal,
      globalDiscount: finalGlobalDiscount,
      totalDiscount,
      grandTotal,
      paymentType: paymentType || 'Cash'
    });

    await bill.save();

    // Update inventory (decrease stock)
    await updateInventory(processedItems, false);

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bills
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('items.productId', 'name sku quantity');
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search bills by bill number or phone number
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const bills = await Bill.find({
      $or: [
        { billNumber: { $regex: query, $options: 'i' } },
        { customerPhone: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bill (Delta system)
router.put('/:id', async (req, res) => {
  try {
    const { customerName, customerPhone, items, globalDiscount, paymentType } = req.body;

    // Get original bill
    const originalBill = await Bill.findById(req.params.id);
    if (!originalBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Restore original inventory (add back original quantities)
    await updateInventory(originalBill.items, true);

    // Validate new items and calculate differences
    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    // Create a map of original items for quick lookup
    const originalItemsMap = new Map();
    originalBill.items.forEach(item => {
      originalItemsMap.set(item.productId.toString(), item.quantity);
    });

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        // Restore inventory before failing
        await updateInventory(originalBill.items, false);
        return res.status(404).json({ error: `Product ${item.productName} not found` });
      }

      // Find original quantity for this item
      const originalQty = originalItemsMap.get(item.productId.toString()) || 0;
      const deltaQty = item.quantity - originalQty;

      // Validate quantity
      if (item.quantity <= 0) {
        await updateInventory(originalBill.items, false);
        return res.status(400).json({
          error: `Quantity must be greater than 0 for ${product.name}`
        });
      }

      // Check if new quantity is valid (deltaQty can be negative if reducing quantity)
      if (deltaQty > 0 && product.quantity < deltaQty) {
        // Restore inventory before failing
        await updateInventory(originalBill.items, false);
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Additional needed: ${deltaQty}`
        });
      }

      const itemSubtotal = item.quantity * item.sellingPrice;
      const itemDiscount = item.discount || 0;
      const itemTotal = itemSubtotal - itemDiscount;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: itemDiscount,
        comment: item.comment || '',
        subtotal: itemTotal
      });
    }

    const finalGlobalDiscount = globalDiscount || 0;
    totalDiscount += finalGlobalDiscount;
    const grandTotal = subtotal - totalDiscount;

    if (grandTotal < 0) {
      // Restore inventory before failing
      await updateInventory(originalBill.items, false);
      return res.status(400).json({ error: 'Grand total cannot be negative' });
    }

    // Update bill
    originalBill.customerName = customerName || originalBill.customerName;
    originalBill.customerPhone = customerPhone || originalBill.customerPhone;
    originalBill.items = processedItems;
    originalBill.subtotal = subtotal;
    originalBill.globalDiscount = finalGlobalDiscount;
    originalBill.totalDiscount = totalDiscount;
    originalBill.grandTotal = grandTotal;
    if (paymentType) {
      originalBill.paymentType = paymentType;
    }

    await originalBill.save();

    // Update inventory with new quantities (decrease stock)
    await updateInventory(processedItems, false);

    res.json(originalBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bill (restore inventory)
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Restore inventory
    await updateInventory(bill.items, true);

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate WhatsApp link
router.get('/:id/whatsapp', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('items.productId', 'name');
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const settings = await Settings.getSettings();
    const shopName = settings.shopName;

    // Format message
    let message = `*${shopName}*\n\n`;
    message += `Bill No: ${bill.billNumber}\n`;
    message += `Customer: ${bill.customerName}\n`;
    message += `Phone: ${bill.customerPhone}\n\n`;
    message += `*Items:*\n`;

    bill.items.forEach((item, index) => {
      message += `${index + 1}. ${item.productName} (${item.sku})\n`;
      message += `   Qty: ${item.quantity} x ₹${item.sellingPrice}`;
      if (item.discount > 0) {
        message += ` - Discount: ₹${item.discount}`;
      }
      message += ` = ₹${item.subtotal}\n`;
      if (item.comment) {
        message += `   Note: ${item.comment}\n`;
      }
    });

    message += `\n*Subtotal:* ₹${bill.subtotal}\n`;
    if (bill.globalDiscount > 0) {
      message += `*Global Discount:* ₹${bill.globalDiscount}\n`;
    }
    if (bill.totalDiscount > 0) {
      message += `*Total Discount:* ₹${bill.totalDiscount}\n`;
    }
    message += `*Grand Total:* ₹${bill.grandTotal}\n\n`;
    message += `Thank you for shopping`;

    // Generate WhatsApp link
    const phone = bill.customerPhone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/91${phone}?text=${encodedMessage}`;

    res.json({ whatsappLink, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
