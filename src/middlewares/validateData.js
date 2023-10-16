function validateData(req, res, next) {
  const { email, password } = req.body;
  const BAD_REQUEST_STATUS = 400;
  if (!email) {
    return res.status(BAD_REQUEST_STATUS).json({ message: 'O campo "email" é obrigatório' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O "email" deve ter o formato "email@email.com"' });
  } if (!password) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(BAD_REQUEST_STATUS)
      .json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  next();
}
  
module.exports = validateData;