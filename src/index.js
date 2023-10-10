const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const routesTalker = require('./routes/router');
const validateData = require('./middlewares/validateData');

const app = express();

const BAD_REQUEST_STATUS = 400;
const UNAUTHORIZED_STATUS = 401;

function validateName(req, res, next) {
  const { name } = req.body;
  if (!name) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "name" é obrigatório' });
  }
  if (name.length < 3) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }
  next();
}

function validatePassword(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(UNAUTHORIZED_STATUS).json({ message: 'Token não encontrado' });
  }
  if (token.length !== 16) {
    return res.status(UNAUTHORIZED_STATUS).json({ message: 'Token inválido' });
  }
  next();
}
function validateAge(req, res, next) {
  const { age } = req.body;
  if (!age) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "age" é obrigatório' });
  }
  if (!Number.isInteger(age) || age < 18) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "age" deve ser um número inteiro igual ou maior que 18' });
  }
  next();
}

function validateWatched(req, res, next) {
  const { talk } = req.body;
  if (!talk) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "talk" é obrigatório' });
  }
  if (!talk.watchedAt || typeof talk.watchedAt !== 'string') {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "watchedAt" é obrigatório' });
  }
  next();
}

function validateRegex(req, res, next) {
  const { talk } = req.body;
  const data = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!data.test(talk.watchedAt)) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  next();
}

function validateRate(req, res, next) {
  const { rate } = req.body.talk;
  if (!rate && rate !== 0) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "rate" é obrigatório' });
  }
  next();
}

function validateNumber(req, res, next) {
  const { rate } = req.body.talk;
  if (typeof rate !== 'number' || rate < 1 || rate > 5 || !Number.isInteger(rate)) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "rate" deve ser um número inteiro entre 1 e 5' });
  }
  next();
}

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

app.post('/talker',
  validateName,
  validatePassword,
  validateAge,
  validateWatched,
  validateRegex,
  validateRate,
  validateNumber, async (req, res) => {
    try {
      const { name, age, talk } = req.body;
      const talkers = await fs.readFile(path.join(__dirname, './talker.json'), 'utf-8');
      const parsedTalkers = JSON.parse(talkers);

      const newTalker = {
        id: parsedTalkers.length + 1,
        name,
        age,
        talk,
      };
      parsedTalkers.push(newTalker);
      await fs.writeFile(path.join(__dirname, './talker.json'), JSON.stringify(parsedTalkers));
      res.status(201).json(newTalker);
    } catch (err) {
      console.error(`Erro ao salvar o arquivo: ${err.message}`);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

app.listen(PORT, () => {
  console.log('Online');
});
