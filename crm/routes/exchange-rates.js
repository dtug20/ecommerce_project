const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/store/exchange-rates');
    res.json(result);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

module.exports = router;
