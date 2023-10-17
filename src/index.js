const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();

const path = require('path');
const validateData = require('./middlewares/validateData');

app.use(express.json());
const HTTP_OK_STATUS = 200;
const NO_CONTENT_STATUS = 204;
const BAD_REQUEST_STATUS = 400;
const UNAUTHORIZED_STATUS = 401;
const NOT_FOUND_STATUS = 404;
const SERVER_ERROR_STATUS = 500;
const PORT = process.env.PORT || '3001';

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

function TalkWatchedValidate(req, res, next) {
  const { talk } = req.body;
  if (!talk) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "talk" é obrigatório' });
  }
  if (!talk.watchedAt || typeof talk.watchedAt !== 'string') {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "watchedAt" é obrigatório' });
  }
  next();
}

function TalkRegexValidate(req, res, next) {
  const { talk } = req.body;
  const tagRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!tagRegex.test(talk.watchedAt)) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  next();
}

function talkRateValidate(req, res, next) {
  const { rate } = req.body.talk;
  if (!rate && rate !== 0) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "rate" é obrigatório' });
  }
  next();
}

function talkNumberValidate(req, res, next) {
  const { rate } = req.body.talk;
  if (typeof rate !== 'number' || rate < 1 || rate > 5 || !Number.isInteger(rate)) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "rate" deve ser um número inteiro entre 1 e 5' });
  }
  next();
}

// (nao remover)

const getTalkersData = async () => {
  const talkersData = await fs.readFile(path.join(__dirname, './talker.json'), 'utf-8');
  return JSON.parse(talkersData);
};

const findTalkerIndex = (talkers, id) => talkers.findIndex((talker) => talker.id === Number(id));

const updateTalkerData = async (talkers) => {
  await fs.writeFile(path.join(__dirname, './talker.json'), JSON.stringify(talkers));
};

const sendError = (res, statusCode, message) => res.status(statusCode).json({ message });

app.get('/', (req, res) => {
  res.status(HTTP_OK_STATUS).send();
});

app.get('/talker', async (req, res) => {
  try {
    const talkers = await fs.readFile(path.join(__dirname, './talker.json'), 'utf-8');
    res.status(HTTP_OK_STATUS).json(JSON.parse(talkers)); 
  } catch (error) {
    console.error(`Erro ao ler o arquivo: ${error.message}`);
    res.status(HTTP_OK_STATUS).json([]);
  }
});

app.get('/talker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const talkers = await getTalkersData();
    const talker = talkers.find((talk) => talk.id === Number(id));
    if (!talker) {
      return sendError(res, NOT_FOUND_STATUS, 'Pessoa palestrante não encontrada');
    }
    res.status(HTTP_OK_STATUS).json(talker);
  } catch (error) {
    console.error(`Erro ao ler o arquivo: ${error.message}`);
    res.status(HTTP_OK_STATUS).json([]);
  }
});
app.post('/login', validateData, (req, res) => {
  const token = crypto.randomBytes(8).toString('hex');
  res.status(HTTP_OK_STATUS).json({ token });
});

app.post('/talker',
  validateAge,
  validateName,
  validatePassword,
  TalkRegexValidate,
  TalkWatchedValidate,
  talkRateValidate,
  talkNumberValidate, async (req, res) => {
    try {
      const { name, age, talk } = req.body;
      const parsedTalkers = await getTalkersData();
      const newTalker = {
        id: parsedTalkers.length + 1,
        name,
        age,
        talk,
      };
      parsedTalkers.push(newTalker);
      await updateTalkerData(parsedTalkers);
      res.status(201).json(newTalker);
    } catch (error) {
      console.error(`Erro ao salvar o arquivo: ${error.message}`);
      sendError(res, NOT_FOUND_STATUS, 'Pessoa palestrante não encontrada');
    }
  });

app.delete('/talker/:id', validatePassword, async (req, res) => {
  const { id } = req.params;
  try {
    const talkers = await getTalkersData();
    const indexTalker = findTalkerIndex(talkers, id);
    if (indexTalker === -1) {
      return sendError(res, NOT_FOUND_STATUS, 'Pessoa palestrante não encontrada');
    }
    talkers.splice(indexTalker, 1);
    await updateTalkerData(talkers);
    res.status(NO_CONTENT_STATUS).end();
  } catch (error) {
    console.error(`Erro ao deletar o palestrante: ${error.message}`);
    sendError(res, SERVER_ERROR_STATUS, 'Erro interno do servidor');
  }
});

app.put('/talker/:id', 
  validatePassword, 
  validateName, 
  validateAge, 
  TalkWatchedValidate, 
  TalkRegexValidate, 
  talkRateValidate, 
  talkNumberValidate, async (req, res) => {
    const { name, age, talk } = req.body;
    const { id } = req.params;
    try {
      const talkers = await getTalkersData();
      const indexTalker = findTalkerIndex(talkers, id);
      if (indexTalker === -1) {
        return sendError(res, NOT_FOUND_STATUS, 'Pessoa palestrante não encontrada');
      }

      talkers[indexTalker] = { id: Number(id), name, age, talk };
      await updateTalkerData(talkers);

      res.status(HTTP_OK_STATUS).json(talkers[indexTalker]);
    } catch (error) {
      console.error(`Erro ao atualizar o arquivo: ${error.message}`);
      sendError(res, SERVER_ERROR_STATUS, 'Erro interno do servidor');
    }
  });
app.listen(PORT, () => {
  console.log('Online');
});