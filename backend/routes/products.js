const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { sku, name, quantity, costPrice, sellingPrice } = req.body;

    // Validation
    if (!sku || !name || quantity === undefined || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (quantity < 0 || costPrice < 0 || sellingPrice < 0) {
      return res.status(400).json({ error: 'Values cannot be negative' });
    }

    const product = new Product({
      sku,
      name,
      quantity,
      costPrice,
      sellingPrice
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { sku, name, quantity, costPrice, sellingPrice } = req.body;

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    if (costPrice !== undefined && costPrice < 0) {
      return res.status(400).json({ error: 'Cost price cannot be negative' });
    }

    if (sellingPrice !== undefined && sellingPrice < 0) {
      return res.status(400).json({ error: 'Selling price cannot be negative' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { sku, name, quantity, costPrice, sellingPrice },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products with stock > 0 (for billing dropdown)
router.get('/stock/available', async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $gt: 0 } })
      .sort({ name: 1 })
      .select('sku name quantity sellingPrice');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
