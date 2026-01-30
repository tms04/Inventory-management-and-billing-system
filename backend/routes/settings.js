const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const { shopName, lastBillNumber } = req.body;
    const settings = await Settings.getSettings();

    if (shopName !== undefined) {
      settings.shopName = shopName;
    }
    if (lastBillNumber !== undefined) {
      settings.lastBillNumber = lastBillNumber;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
