const validateData = (req, res, next) => {
  const { email, password } = req.body;
  const regexEmail = /\S+@\S+\.\S+/;
  const regexPassword = /^[0-9]{6,}$/;

  if (!email) {
    return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  } if (!regexEmail.test(email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  } if (!password) {
    return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  } if (!regexPassword.test(password)) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  next();
};

module.exports = validateData;
