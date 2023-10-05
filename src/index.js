const express = require('express');
const crypto = require('crypto');
const routesTalker = require('./routes/router');
const validateData = require('./middlewares/validateData');

const app = express();

function generateToken() {
  return crypto.randomBytes(8).toString('hex');
}

app.use(express.json());
const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';
app.use('/talker', routesTalker);

app.post('/login', validateData, async (req, res) => {
  const token = generateToken();
  return res.status(200).json({ token });
});
// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});
