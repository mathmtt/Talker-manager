const express = require('express');
const fs = require('fs/promises');

const path = require('path');

const router = express.Router();

router.get('/', async (req, res) => {
  const talkers = await fs.readFile(path.join(__dirname, '../talker.json'), 'utf-8');
    
  if (!talkers) return res.status(200).json([]);
  res.status(200).json(JSON.parse(talkers));
});

module.exports = router;
