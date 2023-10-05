const express = require('express');
const fs = require('fs/promises');

const path = require('path');

const router = express.Router();

router.get('/', async (req, res) => {
  const talkers = await fs.readFile(path.join(__dirname, '../talker.json'), 'utf-8');
    
  if (!talkers) return res.status(200).json([]);
  res.status(200).json(JSON.parse(talkers));
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const talkers = await fs.readFile(path.join(__dirname, '../talker.json'), 'utf-8');

  const talker = JSON.parse(talkers).find((talk) => talk.id === parseInt(id, 10));
  if (!talker) return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });

  res.status(200).json(talker);
});

module.exports = router;
